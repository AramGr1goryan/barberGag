fetch('http://localhost:3000/api/availability/slots?date=2026-10-04&duration=15')
  .then(r => r.json())
  .then(d => {
    if (d.error) return console.error(d.error);
    console.log(d.slots.filter(s => s.startTime >= '13:00' && s.startTime <= '15:00').map(s => s.startTime));
  })
  .catch(console.error);
