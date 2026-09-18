import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
if (!scripts.length) throw new Error("Kein Inline-Script gefunden");
scripts.forEach((source, index) => new vm.Script(source, { filename: `inline-${index}.js` }));

const start = html.indexOf("const XRAY_CSV_PROFILE_VERSION");
const end = html.indexOf("function cell(", start);
if (start < 0 || end < 0) throw new Error("Xray-CSV-Profil nicht gefunden");

const context = {};
vm.createContext(context);
vm.runInContext(
  'const S=["TO DO","EXECUTING","PASSED","FAILED","BLOCKED","ABORTED"];' +
    html.slice(start, end) +
    ";globalThis.parseCSV=parseCSV;globalThis.headers=XRAY_CSV_HEADERS;globalThis.xrayExportStatus=xrayExportStatus;",
  context
);

if (context.headers.length !== 29) throw new Error(`29 Exportspalten erwartet, erhalten: ${context.headers.length}`);

for (const file of ["xray-testfaelle-einfach.csv", "xray-testfaelle-mit-schritten.csv"]) {
  const csv = fs.readFileSync(new URL(`../examples/${file}`, import.meta.url), "utf8");
  const parsed = context.parseCSV(csv);
  if (!parsed.tests.length) throw new Error(`${file}: keine Testfälle erkannt`);
  if (file.includes("mit-schritten") && parsed.tests[0].steps.length !== 3) throw new Error(`${file}: Testschritte fehlen`);
}

const jiraCsv = [
  "Issue Id,Issue Key,Summary,Custom field (Test Type),Custom field (Test Run Status),Step,Action,Result",
  '12345,xr-1,"Mehrzeilige',
  'Zusammenfassung",Manual,PASS,1,Öffnen,"Alles, sichtbar"',
  ",,,,,2,Prüfen,Erfolgreich"
].join("\n");
const parsed = context.parseCSV(jiraCsv);
const test = parsed.tests[0];
if (parsed.tests.length !== 1 || test.key !== "XR-1" || test.localStatus !== "PASSED" || test.steps.length !== 2 || test.steps[1].expectedResult !== "Erfolgreich") {
  throw new Error("Xray-/Jira-CSV-Roundtrip fehlgeschlagen");
}
if (context.xrayExportStatus("PASSED") !== "PASS" || context.xrayExportStatus("FAILED") !== "FAIL" || context.xrayExportStatus("TO DO") !== "TODO") {
  throw new Error("Xray-Status-Export fehlgeschlagen");
}
const definitionOnly = context.parseCSV("Issue Key;Summary\nXR-2;Nur Testdefinition").tests[0];
if (Object.hasOwn(definitionOnly, "status") || Object.hasOwn(definitionOnly, "localStatus")) {
  throw new Error("CSV ohne Ergebnisstatus darf vorhandene Ausführungsstatus nicht überschreiben");
}

console.log(`Xray CSV ${context.headers.length} Spalten · ${test.steps.length} Schritte · ${test.localStatus}`);
