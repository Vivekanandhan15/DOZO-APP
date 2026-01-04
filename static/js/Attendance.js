const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

let currentDate = new Date();

const attendanceData = {};


function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  monthYear.textContent = date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  calendarDays.innerHTML = "";

  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    calendarDays.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("day");
    dayCell.textContent = day;

    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (attendanceData[key]) dayCell.classList.add(attendanceData[key]);

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayCell.classList.add("today");
    }

    calendarDays.appendChild(dayCell);
  }
}

prevMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

nextMonth.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

renderCalendar(currentDate);

// Mock data removed


const API_ENDPOINT = '/attendance/me';

async function fetchAttendanceData(date) {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const res = await fetch(API_ENDPOINT, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const list = await res.json();
      const data = {};

      list.forEach(record => {
        // record.date is likely YYYY-MM-DD
        data[record.date] = record.status.toLowerCase();
      });

      Object.assign(attendanceData, data);
      renderCalendar(date);
    }

  } catch (error) {
    console.error("Error fetching attendance data:", error);
  }
}


// prevMonth.addEventListener("click", () => {
//     currentDate.setMonth(currentDate.getMonth() - 1);
//     fetchAttendanceData(currentDate); 
// });

// nextMonth.addEventListener("click", () => {
//     currentDate.setMonth(currentDate.getMonth() + 1);
//     fetchAttendanceData(currentDate); 
// });

fetchAttendanceData(currentDate);