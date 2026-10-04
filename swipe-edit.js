const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'components', 'admin', 'BarberCalendarManager.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Add framer-motion and Edit2 to imports
content = content.replace(
  /import { Plus, Check, X, ArrowLeft, Sunrise, Sun, Moon, Trash2, ChevronDown } from "lucide-react";/,
  `import { Plus, Check, X, ArrowLeft, Sunrise, Sun, Moon, Trash2, ChevronDown, Edit2 } from "lucide-react";\nimport { motion, useAnimation } from "framer-motion";`
);

// 2. Replace SwipeToDeleteBooking with SwipeBooking
const oldSwipeStart = content.indexOf('function SwipeToDeleteBooking');
const oldSwipeEnd = content.indexOf('export function BarberCalendarManager');
const newSwipe = `function SwipeBooking({ task, isDone, locale, onToggleTask, onDelete, onEdit }: any) {
  const controls = useAnimation();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const swipeThreshold = 80;

  const handleDrag = (e: any, info: any) => {
    if (info.offset.x < -swipeThreshold) {
      setIsDeleting(true);
      setIsEditing(false);
    } else if (info.offset.x > swipeThreshold) {
      setIsEditing(true);
      setIsDeleting(false);
    } else {
      setIsDeleting(false);
      setIsEditing(false);
    }
  };

  const handleDragEnd = async (e: any, info: any) => {
    if (info.offset.x < -swipeThreshold) {
      if (confirm(locale === "ru" ? "Удалить запись?" : "Delete booking?")) {
        onDelete(task.id, true);
      } else {
        controls.start({ x: 0 });
      }
    } else if (info.offset.x > swipeThreshold) {
      onEdit(task);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
    setIsDeleting(false);
    setIsEditing(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 group bg-zinc-800">
      <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-6 text-white font-bold w-1/2 h-full bg-blue-600 pointer-events-none">
        <Edit2 className={\`w-5 h-5 \${isEditing ? 'animate-bounce' : ''}\`} />
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 text-white font-bold w-1/2 h-full bg-red-600 pointer-events-none">
        <Trash2 className={\`w-5 h-5 \${isDeleting ? 'animate-pulse' : ''}\`} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={\`relative z-10 w-full flex items-center justify-between p-3 transition-colors \${isDone ? "bg-[#14281e] border-emerald-500/20" : "bg-[#1d202c]"}\`}
      >
        <div className="flex items-center gap-3 w-full pr-2">
          <button onClick={() => onToggleTask(task)} className={\`shrink-0 w-6 h-6 rounded flex items-center justify-center border transition-colors \${isDone ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/30"}\`}>
            <Check className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold text-blue-300 shrink-0">{task.startTime}-{task.endTime}</span>
              <span className={\`text-[16px] font-bold truncate \${isDone ? "line-through text-muted" : "text-white"}\`}>{task.guestName}</span>
            </div>
            <div className="text-xs text-muted font-mono truncate">{task.guestRealPhone && <a href={\`tel:\${task.guestRealPhone}\`} className="text-primary">📞 {task.guestRealPhone} • </a>}{task.guestPhone} • {task.items.map((i: any) => i.nameSnapshot).join("+")}</div>
            {task.notes && (
              <div className="text-[11px] text-zinc-400 mt-1 bg-white/5 rounded px-2 py-1 leading-tight border border-white/10 whitespace-pre-wrap">
                📝 {task.notes}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

`;

content = content.substring(0, oldSwipeStart) + newSwipe + content.substring(oldSwipeEnd);

// 3. Add states and openFormForEdit
content = content.replace(
  /const \[isManualBookingOpen, setIsManualBookingOpen\] = useState\(false\);/,
  `const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);\n  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);\n  const [guestName, setGuestName] = useState("");\n  const [guestPhone, setGuestPhone] = useState("+374 ");\n  const [customServiceName, setCustomServiceName] = useState("");\n  const [customServicePrice, setCustomServicePrice] = useState("");`
);

content = content.replace(
  /const openForm = \(time: string = ""\) => \{/,
  `const openFormForEdit = (task: any) => {
    setEditingBookingId(task.id);
    setBookingTime(task.startTime);
    setBookingDuration(task.totalDurationMinutes);
    setGuestName(task.guestName);
    setGuestPhone(task.guestPhone);
    if (task.items && task.items[0]) {
      const item = task.items[0];
      if (item.serviceId) {
        setIsCustomService(false);
        setSelectedServiceIds([item.serviceId]);
        setCustomServiceName("");
        setCustomServicePrice("");
      } else {
        setIsCustomService(true);
        setSelectedServiceIds([]);
        setCustomServiceName(item.nameSnapshot);
        setCustomServicePrice(String(item.priceSnapshotMinor / 100));
      }
      setDefaultPrice(String(item.priceSnapshotMinor / 100));
    }
    setIsManualBookingOpen(true);
  };

  const openForm = (time: string = "") => {
    setEditingBookingId(null);
    setGuestName("");
    setGuestPhone("+374 ");
    setCustomServiceName("");
    setCustomServicePrice("");`
);

// 4. Update the render of SwipeToDeleteBooking to SwipeBooking
content = content.replace(/<SwipeToDeleteBooking/g, "<SwipeBooking onEdit={openFormForEdit}");

// 5. Update form inputs to use value/onChange for guest info and custom service
content = content.replace(
  /<input name="cName" type="text" placeholder=\{locale === "ru" \? "Имя" : "Name"\} className="w-full/g,
  `<input name="cName" type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={locale === "ru" ? "Имя" : "Name"} className="w-full`
);

content = content.replace(
  /<input name="cPhone" type="tel" placeholder=\{locale === "ru" \? "Телефон" : "Phone"\} defaultValue="\+374 " className="w-full/g,
  `<input name="cPhone" type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder={locale === "ru" ? "Телефон" : "Phone"} className="w-full`
);

content = content.replace(
  /<input name="cService" type="text" placeholder=\{locale === "ru" \? "Название" : "Name"\} className="w-full/g,
  `<input name="cService" type="text" value={customServiceName} onChange={e => setCustomServiceName(e.target.value)} placeholder={locale === "ru" ? "Название" : "Name"} className="w-full`
);

content = content.replace(
  /<input name="cPrice" type="number" placeholder=\{locale === "ru" \? "Цена" : "Price"\} className="w-full/g,
  `<input name="cPrice" type="number" value={customServicePrice} onChange={e => setCustomServicePrice(e.target.value)} placeholder={locale === "ru" ? "Цена" : "Price"} className="w-full`
);

// 6. Update action in onSubmitBooking
content = content.replace(
  /action: "createManualBooking",/,
  `action: editingBookingId ? "editManualBooking" : "createManualBooking",
          bookingId: editingBookingId,`
);

fs.writeFileSync(p, content, 'utf8');
console.log('SwipeToEdit implemented');
