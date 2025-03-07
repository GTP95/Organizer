/// Calendar Display with Todo Items
export {renderCalendar}
// Core utility function
function getWeekDates(baseDate: Date, startDayOfWeek: number = 0): Date[] {
	const dayOfWeek = baseDate.getDay();
	const daysAgo = Math.floor((dayOfWeek - startDayOfWeek + 7) % 7);

	const startDate = new Date(baseDate);
	startDate.setDate(baseDate.getDate() - daysAgo);

	return Array.from({ length: 7 }, (_, dayIndex) => {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + dayIndex);
		return date;
	});
}

/// DOM Element Factories
const createHeaderRow = (startDate: Date, startDayOfWeek: number) => {
	const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const headers = daysOfWeek.slice(startDayOfWeek)
		.concat(daysOfWeek.slice(0, startDayOfWeek));

	const headerContainer = document.createElement("div");
	headerContainer.className = "header-row";

	headerContainer.style = `
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #4CAF50;
    color: white;
    border-radius: 4px;
    padding: 12px;
  `;

	headers.forEach(header => {
		const headerElement = document.createElement("div");
		headerElement.textContent = header;
		headerElement.className = "header-cell";
		headerContainer.appendChild(headerElement);
	});

	return headerContainer;
};

const createDayCell = (date: Date) => {
	const cell = document.createElement("div");
	cell.className = "day-cell";
	cell.style = `
    border: 1px solid #e0e0e0;
    padding: 15px;
    height: 150px;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    cursor: pointer;
  `;

	const dateElement = document.createElement("div");
	dateElement.className = "date-display";
	dateElement.textContent = date.getDate().toString();
	cell.appendChild(dateElement);

	cell.dataset.date = date.toISOString().substring(0, 10);

	// Todo input field
	const input = document.createElement("input");
	input.className = "todo-input";
	input.style = `
    margin-top: 8px;
    display: none;
    padding: 8px;
    border: 1px solid #ddd;
    width: 100%;
    max-width: 100%;
  `;
	input.placeholder = "Add todo...";

	// Todo list
	const todoList = document.createElement("div");
	todoList.className = "todo-list";

	// Event handlers
	input.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (input.value.trim() !== "") {
				const item = document.createElement("div");
				item.className = "todo-item";
				item.textContent = input.value;
				todoList.appendChild(item);
				input.value = "";
				input.style.display = "none";
			}
		}
	});

	input.addEventListener("blur", () => {
		if (input.style.display === "block") {
			input.style.display = "none";
		}
	});

	cell.appendChild(input);
	cell.appendChild(todoList);
	return cell;
};

/// Rendering
function renderCalendar(baseDate: Date = new Date(), startDayOfWeek: number = 0, containerId: string = "calendar") {
	const container = document.getElementById(containerId);
	if (!container) return;

	const weekDates = getWeekDates(baseDate, startDayOfWeek);

	const calendarContainer = document.createElement("div");
	calendarContainer.className = "calendar-container";

	// Create header row
	calendarContainer.appendChild(createHeaderRow(weekDates[0], startDayOfWeek));

	// Create days grid row
	const daysContainer = document.createElement("div");
	daysContainer.style = `
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    padding: 10px;
  `;

	weekDates.forEach(date => {
		const dayCell = createDayCell(date);

		// Open input field on day click
		dayCell.addEventListener("click", (e) => {
			const input = e.currentTarget.querySelector(".todo-input")!;
			input.style.display = input.style.display === "none" ? "block" : "none";
			if (input.style.display === "block") input.focus();
		});

		daysContainer.appendChild(dayCell);
	});

	calendarContainer.appendChild(daysContainer);
	container.appendChild(calendarContainer);
}

/// Styling
document.head.insertAdjacentHTML(
	"beforeend",
	`
  <style>
    .calendar-container {
      margin: 20px;
      max-width: 800px;
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
    }
    
    .header-cell {
      text-align: center;
      font-weight: bold;
      padding: 8px;
    }
    
    .day-cell {
      transition: background-color 0.2s;
    }
    
    .day-cell:hover {
      background-color: #f0f0f0;
    }
    
    .date-display {
      font-size: 20px;
      text-align: center;
      margin-bottom: 8px;
    }
    
    .todo-item {
      background-color: #e8f5e9;
      padding: 6px 10px;
      margin: 4px 0;
      border-radius: 3px;
    }
  </style>
  `
);

/// Usage Example
document.addEventListener("DOMContentLoaded", () => {
	const calendarElement = document.getElementById('calendar-container');
	if (calendarElement) {
		renderCalendar(new Date(), 0, 'calendar-container'); // 0 for Sunday
	}
});
