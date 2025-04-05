import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import {SettingTab} from "./SettingsTab";
import i18next from './i18n';

interface WeeklyCalendarData {
	[notePath: string]: {
		[day: string]: Task[];
	};
}

interface PluginSettings {
	startOfWeek: 'Monday' | 'Sunday';
	language: string;
}

class Task {
	constructor(public text: string, public completed: boolean = false) {}
}

const DEFAULT_SETTINGS: PluginSettings = {
	startOfWeek: 'Monday',
	language: 'en'
};

export default class WeeklyCalendarPlugin extends Plugin {
	pluginDirPath: string;
	dataPath: string;
	settingsPath: string;
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		const lang = this.settings.language;
		i18next.changeLanguage(lang);
		this.pluginDirPath=`${this.app.vault.configDir}/plugins/organizer`;
		this.dataPath = `${this.pluginDirPath}/data.json`;
		this.settingsPath = `${this.pluginDirPath}/settings.json`;

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

		this.addSettingTab(new SettingTab(this.app, this));
	}

	async renderCalendar(container: HTMLElement, notePath: string) {
		container.empty();
		const data = await this.loadData();
		const startOfWeek = this.settings.startOfWeek;
		const days = startOfWeek === 'Monday'
			? [i18next.t('common:monday'), i18next.t('common:tuesday'), i18next.t('common:wednesday'), i18next.t('common:thursday'), i18next.t('common:friday'), i18next.t('common:saturday'), i18next.t('common:sunday')]
			: [i18next.t('common:sunday'), i18next.t('common:monday'), i18next.t('common:tuesday'), i18next.t('common:wednesday'), i18next.t('common:thursday'), i18next.t('common:friday'), i18next.t('common:saturday')];

		const wrapper = container.createDiv({ cls: 'weekly-calendar-wrapper' });
		const table = wrapper.createEl('table');
		const headerRow = table.createEl('tr');

		days.forEach(day => {
			headerRow.createEl('th', { text: day });
		});

		const contentRow = table.createEl('tr');
		days.forEach(day => {
			const td = contentRow.createEl('td', { cls: 'calendar-day' });

			const list = td.createEl('ul');
			if (data[notePath]?.[day]) {
				data[notePath][day].forEach(todo => {
					const li = list.createEl('li', { cls: 'calendar-item' });

					const strikeBtn = li.createEl('button', { cls: 'calendar-strike', text: '✓' });
					strikeBtn.onClickEvent(async () => {
						await this.markTodoCompleted(notePath, day, todo.text);
						this.renderCalendar(container, notePath);
					});

					const todoText = li.createSpan({ text: todo.text });
					if (todo.completed) {
						todoText.style.textDecoration = 'line-through';
					}
				});
			}

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

		// Add Clear Completed button
		const clearCompletedBtn = wrapper.createEl('button', { text: 'Clear Completed' });
		clearCompletedBtn.onClickEvent(async () => {
			await this.clearCompletedTasks(notePath);
			this.renderCalendar(container, notePath);
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
		const dirPath = `${this.app.vault.configDir}/plugins/organizer`;
		const filePath = `${dirPath}/data.json`;

		if (!await this.app.vault.adapter.exists(dirPath)) {
			await this.app.vault.adapter.mkdir(dirPath);
		}

		await this.app.vault.adapter.write(filePath, JSON.stringify(data, null, 2));
	}


	async addTodo(notePath: string, day: string, todoText: string) {
		const data = await this.loadData();
		if (!data[notePath]) data[notePath] = {};
		if (!data[notePath][day]) data[notePath][day] = [];
		data[notePath][day].push(new Task(todoText));
		await this.saveData(data);
	}

	async removeTodo(notePath: string, day: string, todoText: string) {
		const data = await this.loadData();
		if (data[notePath]?.[day]) {
			data[notePath][day] = data[notePath][day].filter(item => item.text !== todoText);
			await this.saveData(data);
		}
	}

	async markTodoCompleted(notePath: string, day: string, todoText: string) {
		const data = await this.loadData();
		if (data[notePath]?.[day]) {
			const todoItem = data[notePath][day].find(item => item.text === todoText);
			if (todoItem) {
				todoItem.completed = !todoItem.completed;
				await this.saveData(data);
			}
		}
	}

	async clearCompletedTasks(notePath: string) {
		const data = await this.loadData();
		if (data[notePath]) {
			for (const day in data[notePath]) {
				data[notePath][day] = data[notePath][day].filter(task => !task.completed);
			}
			await this.saveData(data);
		}
	}

	async loadSettings() {
		try {
			const content = await this.app.vault.adapter.read(this.settingsPath);
			this.settings= JSON.parse(content);
		} catch (error) {
			this.settings=DEFAULT_SETTINGS;
		}

	}

	async saveSettings() {
		if (!await this.app.vault.adapter.exists(this.pluginDirPath)) {
			await this.app.vault.adapter.mkdir(this.pluginDirPath);
		}

		await this.app.vault.adapter.write(this.settingsPath, JSON.stringify(this.settings, null, 2));
	}

}
