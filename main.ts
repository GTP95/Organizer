import { Plugin, TFile, Notice } from "obsidian";
import { Modal } from "obsidian";


// Utility function to calculate week dates
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

interface TodoEntry {
	date: string;
	todos: string[];
}

class CalendarModal extends Modal {
	private weekDates: Date[];
	private todolist: TodoEntry[] = [];
	private containerEl: HTMLDivElement;

	constructor(plugin: any, baseDate: Date, startDay: number) {
		super(plugin.app);
		this.weekDates = getWeekDates(baseDate, startDay);
	}

	onOpen() {
		const { contentEl } = this;
		const mainContainer = this.containerEl = contentEl.createDiv({});

		// Add styles inside the modal
		mainContainer.style = `
          max-width: 800px;
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin: 20px;
        `;
		mainContainer.appendChild(this.createStyleElement());

		// Create calendar view
		this.containerEl.appendChild(this.createHeaderRow());
		this.containerEl.appendChild(this.createDaysGrid());
	}

	private createStyleElement() {
		const styleEl = document.createElement('style');
		styleEl.innerHTML = `
            .header-cell {
                font-weight: bold;
                padding: 8px;
                background-color: #4CAF50;
                color: white;
                text-align: center;
            }
            .day-cell {
                border: 1px solid #e0e0e0;
                padding: 15px;
                height: 150px;
                display: flex;
                flex-direction: column;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .day-cell:hover { background-color: #f0f0f0; }
            .date-display { font-size: 20px; text-align: center; margin-bottom: 8px; }
            .todo-input {
                margin-top: 8px;
                padding: 8px;
                border: 1px solid #ddd;
                width: 100%;
                display: none;
            }
            .todo-item {
                background-color: #e8f5e9;
                padding: 6px 10px;
                margin: 4px 0;
                border-radius: 3px;
            }
        `;
		return styleEl;
	}

	private createHeaderRow() {
		const headerContainer = this.containerEl.createDiv({ cls: 'header-row' });
		const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const startDay = this.weekDates[0].getDay();
		const headers = daysOfWeek.slice(startDay)
			.concat(daysOfWeek.slice(0, startDay));

		headers.forEach(header => {
			const headerEl = headerContainer.createEl('div', { cls: 'header-cell' });
			headerEl.setText(header);
		});
		return headerContainer;
	}

	private createDaysGrid() {
		const daysContainer = this.containerEl.createDiv({
			cls: 'days-grid',
			styles: `
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 10px;
                padding: 10px;
            `
		});

		this.weekDates.forEach((date) => {
			daysContainer.appendChild(this.createDayCell(date));
		});

		return daysContainer;
	}

	private createDayCell(date: Date): HTMLDivElement {
		const cell = document.createElement('div');
		cell.className = 'day-cell';

		// Date display
		const dateEl = cell.createDiv({ cls: 'date-display' });
		dateEl.textContent = date.getDate().toString();

		// Todo list
		const todoList = cell.createDiv({ cls: 'todo-list' });
		const existingTodos = this.getExistingTodos(date);
		existingTodos.forEach(todo => this.addTodoItem(todo, todoList));

		// Input field
		const input = document.createElement("input");
		input.className = "todo-input";
		input.placeholder = "Add todo...";

		// Handers
		cell.addEventListener('click', () => {
			const visible = input.style.display === 'none';
			input.style.display = visible ? 'block' : 'none';
			if (visible) input.focus();
		});

		input.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				const value = input.value.trim();
				if (value) {
					this.addTodo(date, value);
					this.addTodoItem(value, todoList);
					input.value = "";
					input.style.display = 'none';
				}
			}
		});

		cell.appendChild(input);
		cell.appendChild(todoList);
		return cell;
	}

	private addTodoItem(text: string, list: HTMLDivElement) {
		const item = list.createDiv({ cls: 'todo-item' });
		item.setText(text);
	}

	private getExistingTodos(date: Date): string[] {
		const entry = this.todolist.find(e => e.date === date.toISOString());
		return entry ? entry.todos : [];
	}

	private addTodo(date: Date, text: string) {
		const key = date.toISOString();
		const entry = this.todolist.find(e => e.date === key);
		if (entry) entry.todos.push(text);
		else this.todolist.push({ date: key, todos: [text] });
	}
}

class CalendarPlugin extends Plugin {
	async onload() {
		console.log('Loading Calendar Plugin...');

		this.addCommand({
			id: 'show-calendar',
			name: 'Show Weekly Calendar',
			callback: () => this.showCalendar()
		});
	}

	private showCalendar() {
		const modal = new CalendarModal(this, new Date(), 0);
		modal.open();
	}

	onunload() {}
}

export default CalendarPlugin;
