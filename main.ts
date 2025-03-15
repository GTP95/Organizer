import { App, Plugin, WorkspaceLeaf, ItemView, TFile } from 'obsidian';

interface WeeklyCalendarData {
	[day: string]: string[];
}

class WeeklyCalendarView extends ItemView {
	static viewType = 'weekly-calendar';
	plugin: WeeklyCalendarPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: WeeklyCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return WeeklyCalendarView.viewType;
	}

	getDisplayText() {
		return 'Weekly Calendar';
	}

	async onOpen() {
		await this.renderView();
	}

	async renderView() {
		const container = this.containerEl.children[1];
		container.empty();

		const data = await this.plugin.loadData();
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		const table = container.createEl('table', { cls: 'weekly-calendar' });
		const headerRow = table.createEl('tr');

		// Create header row
		days.forEach(day => {
			headerRow.createEl('th', { text: day });
		});

		// Create content row
		const contentRow = table.createEl('tr');
		days.forEach(day => {
			const td = contentRow.createEl('td');

			// Todo list
			const list = td.createEl('ul');
			data[day].forEach(todo => {
				const li = list.createEl('li');
				li.createSpan({ text: todo });

				// Delete button
				const deleteBtn = li.createEl('button', { text: '×' });
				deleteBtn.onClickEvent(async () => {
					await this.plugin.removeTodo(day, todo);
					await this.renderView();
				});
			});

			// Input field
			const input = td.createEl('input', { type: 'text', placeholder: 'Add todo' });
			input.addEventListener('keypress', async (e) => {
				if (e.key === 'Enter' && input.value.trim()) {
					await this.plugin.addTodo(day, input.value.trim());
					input.value = '';
					await this.renderView();
				}
			});
		});
	}
}

export default class WeeklyCalendarPlugin extends Plugin {
	dataPath: string;

	async onload() {
		this.dataPath = `${this.app.vault.configDir}/plugins/weekly-calendar/data.json`;

		this.registerView(WeeklyCalendarView.viewType, (leaf) => new WeeklyCalendarView(leaf, this));

		this.addRibbonIcon('calendar', 'Weekly Calendar', () => {
			this.activateView();
		});
	}

	async activateView() {
		const leaves = this.app.workspace.getLeavesOfType(WeeklyCalendarView.viewType);
		if (leaves.length === 0) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: WeeklyCalendarView.viewType,
				active: true,
			});
		}
	}

	async loadData(): Promise<WeeklyCalendarData> {
		try {
			const content = await this.app.vault.adapter.read(this.dataPath);
			return JSON.parse(content);
		} catch (error) {
			return this.getDefaultData();
		}
	}

	getDefaultData(): WeeklyCalendarData {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const data: WeeklyCalendarData = {};
		days.forEach(day => data[day] = []);
		return data;
	}

	async saveData(data: WeeklyCalendarData) {
		const dirPath = `${this.app.vault.configDir}/plugins/weekly-calendar`;
		const filePath = `${dirPath}/data.json`;

		if (!await this.app.vault.adapter.exists(dirPath)) {
			await this.app.vault.adapter.mkdir(dirPath);
		}

		await this.app.vault.adapter.write(filePath, JSON.stringify(data, null, 2));
	}

	async addTodo(day: string, todo: string) {
		const data = await this.loadData();
		data[day].push(todo);
		await this.saveData(data);
	}

	async removeTodo(day: string, todo: string) {
		const data = await this.loadData();
		data[day] = data[day].filter(item => item !== todo);
		await this.saveData(data);
	}
}
