import { App, Plugin, MarkdownPostProcessorContext, TFile } from 'obsidian';

interface WeeklyCalendarData {
	[notePath: string]: {
		[day: string]: string[];
	};
}

export default class WeeklyCalendarPlugin extends Plugin {
	dataPath: string;

	async onload() {
		this.dataPath = `${this.app.vault.configDir}/plugins/weekly-calendar/data.json`;

		this.registerMarkdownCodeBlockProcessor('weekly-calendar', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.renderCalendar(el, ctx.sourcePath);
		});

		this.addCommand({
			id: 'insert-weekly-calendar',
			name: 'Insert Weekly Calendar',
			editorCallback: (editor) => {
				editor.replaceSelection('```weekly-calendar\n```');
			}
		});
	}

	async renderCalendar(container: HTMLElement, notePath: string) {
		const data = await this.loadData();
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		const wrapper = container.createDiv({ cls: 'weekly-calendar-wrapper' });
		const table = wrapper.createEl('table');
		const headerRow = table.createEl('tr');

		// Create header row
		days.forEach(day => {
			headerRow.createEl('th', { text: day.substring(0, 3) });
		});

		// Create content row
		const contentRow = table.createEl('tr');
		days.forEach(day => {
			const td = contentRow.createEl('td', { cls: 'calendar-day' });

			// Todo list
			const list = td.createEl('ul');
			if (data[notePath]?.[day]) {
				data[notePath][day].forEach(todo => {
					const li = list.createEl('li', { cls: 'calendar-item' });
					li.createSpan({ text: todo });

					// Delete button
					const deleteBtn = li.createEl('button', { cls: 'calendar-delete', text: '×' });
					deleteBtn.onClickEvent(async () => {
						await this.removeTodo(notePath, day, todo);
						this.renderCalendar(container, notePath);
					});
				});
			}

			// Input field
			const input = td.createEl('input', {
				type: 'text',
				cls: 'calendar-input',
				placeholder: 'Add task'
			});

			input.addEventListener('keypress', async (e) => {
				if (e.key === 'Enter' && input.value.trim()) {
					await this.addTodo(notePath, day, input.value.trim());
					this.renderCalendar(container, notePath);
				}
			});
		});
	}

	async loadData(): Promise<WeeklyCalendarData> {
		try {
			const content = await this.app.vault.adapter.read(this.dataPath);
			return JSON.parse(content);
		} catch (error) {
			return {};
		}
	}

	async saveData(data: WeeklyCalendarData) {
		const dirPath = `${this.app.vault.configDir}/plugins/weekly-calendar`;
		const filePath = `${dirPath}/data.json`;

		if (!await this.app.vault.adapter.exists(dirPath)) {
			await this.app.vault.adapter.mkdir(dirPath);
		}

		await this.app.vault.adapter.write(filePath, JSON.stringify(data, null, 2));
	}

	async addTodo(notePath: string, day: string, todo: string) {
		const data = await this.loadData();
		if (!data[notePath]) data[notePath] = {};
		if (!data[notePath][day]) data[notePath][day] = [];
		data[notePath][day].push(todo);
		await this.saveData(data);
	}

	async removeTodo(notePath: string, day: string, todo: string) {
		const data = await this.loadData();
		if (data[notePath]?.[day]) {
			data[notePath][day] = data[notePath][day].filter(item => item !== todo);
			await this.saveData(data);
		}
	}
}
