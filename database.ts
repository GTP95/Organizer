import { App, Notice } from 'obsidian';
import initSqlJs, { Database as SQLDatabase } from 'sql.js';

export class DatabaseManager {
	private db: SQLDatabase;
	private dbPath: string;

	constructor(private app: App, dbPath: string) {
		this.dbPath = dbPath;
	}

	async initialize() {
		// Create directory if needed
		const dir = this.dbPath.split('/').slice(0, -1).join('/');
		if (dir && !await this.app.vault.adapter.exists(dir)) {
			await this.app.vault.adapter.mkdir(dir);
		}

		// Initialize SQL.js
		const SQL = await initSqlJs({
			locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm'
		});

		// Load existing database or create new
		if (await this.app.vault.adapter.exists(this.dbPath)) {
			const data = await this.app.vault.adapter.readBinary(this.dbPath);
			this.db = new SQL.Database(new Uint8Array(data));
		} else {
			this.db = new SQL.Database();
		}

		// Create tables
		this.db.exec(`
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY,
                day TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
	}

	async saveDatabase() {
		const data = this.db.export();
		await this.app.vault.adapter.writeBinary(this.dbPath, data);
	}

	addTodo(day: string, content: string) {
		const stmt = this.db.prepare(
			"INSERT INTO todos (day, content) VALUES (:day, :content)"
		);
		stmt.bind({ ':day': day, ':content': content });
		stmt.step();
		stmt.free();
	}

	getTodos(day: string) {
		const stmt = this.db.prepare(
			"SELECT * FROM todos WHERE day = :day ORDER BY created_at"
		);
		stmt.bind({ ':day': day });
		const results = [];
		while (stmt.step()) results.push(stmt.getAsObject());
		stmt.free();
		return results;
	}

	deleteTodo(id: number) {
		const stmt = this.db.prepare("DELETE FROM todos WHERE id = :id");
		stmt.bind({ ':id': id });
		stmt.step();
		stmt.free();
	}
}
