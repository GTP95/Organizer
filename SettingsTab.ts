import ExamplePlugin from './main';
import {App, MarkdownView, PluginSettingTab, Setting} from 'obsidian';
import * as path from 'path';
import i18n from "./i18n";


export class SettingTab extends PluginSettingTab {
	plugin: ExamplePlugin;

	constructor(app: App, plugin: ExamplePlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Start of the week')
			.setDesc('Select the starting day of the week')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('Monday', 'Monday')
					.addOption('Sunday', 'Sunday')
					.setValue(this.plugin.settings.startOfWeek)
					.onChange(async (value) => {
						this.plugin.settings.startOfWeek = value as 'Monday' | 'Sunday';
						await this.plugin.saveSettings();
						// Re-render the calendar
						const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (activeView) {
							const container = activeView.containerEl.querySelector('.weekly-calendar-wrapper');
							if (container) {
								// @ts-ignore activeView can't be null as it is checked above
								this.plugin.renderCalendar(<HTMLElement>container, activeView.file.path);
							}
						}
					})
			);

		new Setting(containerEl)
			.setName("Language")
			.setDesc("Select the language")
			.addDropdown(async (dropdown) => {
				let locales = await this.getLocaleFiles( `${this.app.vault.configDir}/plugins/organizer/locales`);
				locales.forEach(locale => {
					dropdown.addOption(locale, locale);
				});
				dropdown.setValue(this.plugin.settings.language);
				dropdown.onChange(async (value) => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
					i18n.changeLanguage(value);
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (activeView) {
						const container = activeView.containerEl.querySelector('.weekly-calendar-wrapper');
						if (container) {
							// @ts-ignore activeView can't be null as it is checked above
							this.plugin.renderCalendar(<HTMLElement>container, activeView.file.path);
						}
					}
				});
			});
	}

	async getLocaleFiles(directory: string): Promise<string[]> {
		try {
			const listedFiles = await this.app.vault.adapter.list(directory);
			return listedFiles.folders
				.map(folder => path.basename(folder));
		} catch (err) {
			console.error('Error reading locale files:', err);
			return [];
		}
	}
}
