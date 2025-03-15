import { ItemView, WorkspaceLeaf, Modal, App } from 'obsidian';
import { DatabaseManager } from './database';

export const VIEW_TYPE = 'weekly-calendar';

export class WeeklyCalendarView extends ItemView {
	private days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	constructor(leaf: WorkspaceLeaf, private db: DatabaseManager) {
		super(leaf);
	}

	getViewType() { return VIEW_TYPE; }
	getDisplayText() { return 'Weekly Calendar'; }

	async onOpen() {
		await this.render();
	}

	async render() {
		const container = this.containerEl.children[1];
		container.empty();

		const table = container.createEl('table', { cls: 'weekly-calendar' });
		const header = table.createEl('tr');
		this.days.forEach(day => header.createEl('th', { text: day }));

		const contentRow = table.createEl('tr');
		this.days.forEach(day => {
			const cell = contentRow.createEl('td');
			this.renderDayCell(cell, day);
		});
	}

	private renderDayCell(container: HTMLElement, day: string) {
		container.empty();

		// Add existing todos
		const todos = this.db.getTodos(day);
		const list = container.createEl('ul');
		todos.forEach(todo => {
			const li = list.createEl('li');
			li.textContent = todo.content;
			li.createEl('button', { text: '×', cls: 'todo-delete' })
				.onclick = () => {
				this.db.deleteTodo(todo.id);
				this.render();
			};
		});

		// Add new todo button
		container.createEl('button', {
			text: '+ Add Task',
			cls: 'todo-add'
		}).onclick = () => new TodoModal(this.app, day, this.db, () => this.render()).open();
	}
}

class TodoModal extends Modal {
	constructor(
		app: App,
		private day: string,
		private db: DatabaseManager,
		private callback: () => void
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: `Add Task for ${this.day}` });

		const input = contentEl.createEl('input', { type: 'text' });
		contentEl.createEl('button', { text: 'Add' })
			.onclick = () => {
			if (input.value.trim()) {
				this.db.addTodo(this.day, input.value.trim());
				this.db.saveDatabase();
				this.callback();
				this.close();
			}
		};
	}

	onClose() {
		this.contentEl.empty();
	}
}
