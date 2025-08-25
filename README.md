Simple Todo app:

Backend: Node.js + Express + TypeScript (CommonJS)
Frontend: React + TypeScript (Vite) in todo-ui/
Storage: JSON file at data/todos.json (auto-created)

___________________________________________________________________________________

Requirements
Node.js: ≥ 20.19 or 22.12+
Check with: node -v
Free ports: 3000 (API) and 5173 (UI)

Windows PowerShell note:
If you see npm.ps1 cannot be loaded, run:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

___________________________________________________________________________________

Run (Development):

1) Backend (API) from the repository root:

npm install
npm run dev:server

3) Frontend (UI) in a second terminal:

cd todo-ui
npm install
npm run dev

___________________________________________________________________________________

Troubleshooting:

vite is not recognized → run npm install inside todo-ui/.
tsc is not recognized → run npm install in the repo root.
Port already in use → stop other instances or change ports.
