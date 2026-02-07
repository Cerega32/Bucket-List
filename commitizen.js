module.exports = {
  // Добавим описание на русском языке ко всем типам
  types: [
    { value: "feat", name: 'feat:      Добавление нового функционала' },
    { value: "fix", name: "fix:       Исправление ошибок" },
    { value: "design", name: "design:     Добавление дизайна или изменение" },
    { value: "backend", name: "backend:   Изменения в бэкенде" },
    {
      value: "build",
      name: "build:     Сборка проекта или изменения внешних зависимостей",
    },
    {
      value: "perf",
      name: "perf:      Изменения направленные на улучшение производительности",
    },
    {
      value: "refactor",
      name: "refactor:  Правки кода без исправления ошибок или добавления новых функций",
    },
    {
      value: "style",
      name: "style:     Правки по кодстайлу (табы, отступы, точки, запятые и т.д.)",
    },
    { value: "docs", name: "docs:      Обновление документации" },
    { value: "test", name: "test:      Добавление тестов" },
    { value: "revert", name: "revert:    Откат на предыдущие коммиты" },
  ],

  // Возможность задать спец ОБЛАСТЬ для определенного типа коммита (пример для 'fix')
  /*
    scopeOverrides: {
      fix: [
        {name: 'style'},
        {name: 'e2eTest'},
        {name: 'unitTest'}
      ]
    },
    */

  // Поменяем дефолтные вопросы
  messages: {
    type: "Какие изменения вы вносите?",
    // scope: "\nВыберите ОБЛАСТЬ, которую вы изменили (опционально):",
    // // Спросим если allowCustomScopes в true
    // customScope: "Укажите свою ОБЛАСТЬ:",
    subject: "Напишите КОРОТКОЕ описание в ПОВЕЛИТЕЛЬНОМ наклонении:\n",
    // body: 'Напишите ПОДРОБНОЕ описание (опционально). Используйте "|" для новой строки:\n',
    // breaking: "Список BREAKING CHANGES (опционально):\n",
    // footer: "Место для мета данных (тикетов, ссылок и остального). Например: SECRETMRKT-700, SECRETMRKT-800:\n",
    confirmCommit: "Вас устраивает получившийся коммит?",
  },

  // Разрешим собственную ОБЛАСТЬ
  allowCustomScopes: true,

  // Запрет на Breaking Changes
  allowBreakingChanges: false,

  // Префикс для нижнего колонтитула
  // footerPrefix: "МЕТА ДАННЫЕ:",

  // limit subject length
  subjectLimit: 72,

  typePrefix: "",
  typeSuffix: "",

  skipQuestions: ["body", "scope", "footer"],
};
