import { Plugin, TFile, MarkdownPostProcessorContext } from 'obsidian';
import * as YAML from 'yaml';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default class WeeklyCalendarPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor('weekly-calendar', this.processCalendarBlock.bind(this));
	}

	private async processCalendarBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
		if (!(file instanceof TFile)) return;

		const content = await this.app.vault.read(file);
		let frontmatterData = this.parseFrontmatter(content);

		const table = this.createCalendarTable(frontmatterData, file);
		el.appendChild(table);
	}

	private parseFrontmatter(content: string): any {
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
		if (!frontmatterMatch) return {};

		try {
			return YAML.parse(frontmatterMatch[1]) || {};
		} catch (e) {
			console.error('Error parsing frontmatter:', e);
			return {};
		}
	}

	private createCalendarTable(frontmatterData: any, file: TFile): HTMLTableElement {
		const table = document.createElement('table');
		table.addClass('weekly-calendar');

		// Create header row
		const headerRow = table.createTHead().insertRow();
		DAYS_OF_WEEK.forEach(day => {
			const th = document.createElement('th');
			th.textContent = day;
			headerRow.appendChild(th);
		});

		// Create body row
		const bodyRow = table.insertRow();
		DAYS_OF_WEEK.forEach(day => {
			const td = document.createElement('td');
			td.addClass('calendar-day');

			// Display existing todos
			const todos = frontmatterData.weeklyTodos?.[day] || [];
			todos.forEach((todo: string) => {
				const todoDiv = document.createElement('div');
				todoDiv.textContent = `- ${todo}`;
				td.appendChild(todoDiv);
			});

			// Add todo interaction
			td.addEventListener('dblclick', async () => {
				const newTodo = prompt('Enter new todo:');
				if (newTodo) {
					await this.updateTodoInFrontmatter(file, day, newTodo);
				}
			});

			bodyRow.appendChild(td);
		});

		return table;
	}

	private async updateTodoInFrontmatter(file: TFile, day: string, newTodo: string) {
		await this.app.vault.process(file, (data) => {
			const frontmatterMatch = data.match(/^---\n[\s\S]*?\n---\n/);
			let frontmatter = this.parseFrontmatter(data);

			// Update todos
			if (!frontmatter.weeklyTodos) frontmatter.weeklyTodos = {};
			if (!frontmatter.weeklyTodos[day]) frontmatter.weeklyTodos[day] = [];
			frontmatter.weeklyTodos[day].push(newTodo);

			const yaml = YAML.stringify(frontmatter);
			return frontmatterMatch
				? data.replace(frontmatterMatch[0], `---\n${yaml}---\n`)
				: `---\n${yaml}---\n${data}`;
		});
	}

	onunload() {}
}
