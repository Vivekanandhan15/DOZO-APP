const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

let currentDate = new Date();
const attendanceData = {};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/'; return; }

    loadTeacherInfo();
    renderCalendar(currentDate);
    fetchAttendanceData();
});

async function loadTeacherInfo() {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch('/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById('teacher-name-nav').innerText = user.name;
        }
    } catch (e) { }
}

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    monthYear.textContent = date.toLocaleString("default", { month: "long", year: "numeric" });
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
        if (attendanceData[key]) {
            dayCell.classList.add(attendanceData[key].toLowerCase());
        }

        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add("today");
        }
        calendarDays.appendChild(dayCell);
    }
}

async function fetchAttendanceData() {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch('/teachers/attendance/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const list = await res.json();
            list.forEach(record => {
                attendanceData[record.date] = record.status;
            });
            renderCalendar(currentDate);
        }
    } catch (error) {
        console.error(error);
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

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
}
