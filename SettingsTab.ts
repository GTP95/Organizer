import ExamplePlugin from './main';
import {App, MarkdownView, PluginSettingTab, Setting} from 'obsidian';
import * as path from 'path';
import i18n from "./i18n";
import i18next from "i18next";


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

		new Setting(containerEl)	//TODO: switching languages can cause tasks to disappear, but they seem to reapper when going back to the original language. Maybe linked to Unicode? Seems to happen when non-ASCII character are rendered
			.setName(i18next.t('common:language'))
			.setDesc(i18next.t('common:language-select'))
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
					this.display()
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

		new Setting(containerEl)
			.setName(i18next.t('common:start-of-week'))
			.setDesc(i18next.t('common:start-week-select'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('Monday', i18next.t('common:monday'))
					.addOption('Sunday', i18next.t('common:sunday'))
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
