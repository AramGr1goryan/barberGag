const fs = require('fs');
const path = require('path');

const filePath = 'c:/barber/src/components/admin/BarberCalendarManager.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Inject Yerevan time logic for initial state
const yerevanLogic = `
  const getTodayYerevanStr = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const yerevan = new Date(utc + (3600000 * 4));
    return yerevan.toISOString().split("T")[0];
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTodayYerevanStr());
`;
code = code.replace(/const todayStr = new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\];\s*const \[selectedDate, setSelectedDate\] = useState<string>\(todayStr\);/, yerevanLogic);

// 2. Inject handleBlockRange
const blockRangeFn = `
  const handleBlockRange = async () => {
    const start = window.prompt(locale === "ru" ? "Время начала (например, 14:00):" : "Start time (e.g. 14:00):", "");
    if (!start) return;
    if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(start.trim())) {
      alert(locale === "ru" ? "Неверный формат времени (нужно ЧЧ:ММ)" : "Invalid time format (HH:MM)");
      return;
    }
    const end = window.prompt(locale === "ru" ? "Время окончания (например, 16:00):" : "End time (e.g. 16:00):", "");
    if (!end) return;
    if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(end.trim())) {
      alert(locale === "ru" ? "Неверный формат времени (нужно ЧЧ:ММ)" : "Invalid time format (HH:MM)");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "blockRange", date: selectedDate, startTime: start.trim(), endTime: end.trim() })
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        alert(d.error || "Error");
      }
      fetchData(selectedDate, true);
    } catch {
      fetchData(selectedDate, true);
    }
  };

  const handleAddOpenSlot = async () => {`;
code = code.replace(/const handleAddOpenSlot = async \(\) => \{/, blockRangeFn);

// 3. Inject Button
const buttonHtml = `
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:flex-wrap gap-2 shrink-0">
            <Button variant="primary" size="lg" onClick={() => openForm()} className="w-full sm:flex-1 gap-2 font-bold shadow-[0_4px_25px_rgba(255,255,255,0.1)]"><Plus className="w-4 h-4" /> {t.barberCalendar.addClient || (locale === "ru" ? "Записать клиента" : "Book Client")}</Button>
            <Button variant="outline" size="lg" onClick={handleAddOpenSlot} className="w-full sm:w-auto px-6 border-white/20 hover:bg-white/5 font-bold"><Plus className="w-4 h-4 mr-2" /> {locale === "ru" ? "Открыть час" : "Open Hour"}</Button>
            <Button variant="outline" size="lg" onClick={handleBlockRange} className="w-full sm:w-auto px-6 border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold"><Trash2 className="w-4 h-4 mr-2" /> {locale === "ru" ? "Закрыть время" : "Block Range"}</Button>
            {isDayOpen ? (
`;
code = code.replace(/<div className="mt-6 pt-4 border-t border-white\/10 flex flex-col sm:flex-row gap-2 shrink-0">\s*<Button variant="primary"[\s\S]*?<\/Button>\s*<Button variant="outline"[\s\S]*?<\/Button>\s*\{isDayOpen \? \(/, buttonHtml);

fs.writeFileSync(filePath, code);
console.log("Patched BarberCalendarManager");
