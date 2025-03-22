import ExamplePlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export class ExampleSettingTab extends PluginSettingTab {
	plugin: ExamplePlugin;

	constructor(app: App, plugin: ExamplePlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
					})
			);
	}
}
