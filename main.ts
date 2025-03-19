import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import {ExampleSettingTab} from "./SettingsTab";

interface WeeklyCalendarData {
	[notePath: string]: {
		[day: string]: string[];
	};
}

interface ExamplePluginSettings {
	dateFormat: string;
	startOfWeek: 'Monday' | 'Sunday';
}
const DEFAULT_SETTINGS: Partial<ExamplePluginSettings> = {
	dateFormat: 'YYYY-MM-DD',
	startOfWeek: 'Monday',
};

export default class WeeklyCalendarPlugin extends Plugin {
	dataPath: string;
	settings: ExamplePluginSettings;

	async onload() {
		await this.loadSettings();
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

		this.addSettingTab(new ExampleSettingTab(this.app, this));
	}

	async renderCalendar(container: HTMLElement, notePath: string) {
		// Clear existing content before re-rendering
		container.empty(); // This is the crucial line that prevents duplicate tables
		const data = await this.loadData();
		const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

					// Delete button
					const deleteBtn = li.createEl('button', { cls: 'calendar-delete', text: '✓' });
					deleteBtn.onClickEvent(async () => {
						await this.removeTodo(notePath, day, todo);
						this.renderCalendar(container, notePath);
					});

					li.createSpan({ text: todo });
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

}
