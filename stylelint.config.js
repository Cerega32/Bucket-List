// конфиг для редактора
// содержит только те правила, которые необходимо исправлять вручную,
// либо правила, фиксируемые автоматически, но требующие ручного контроля.

module.exports = {
	extends: ['stylelint-config-recommended-scss', 'stylelint-prettier/recommended', 'stylelint-order'],
	plugins: ['stylelint-no-unsupported-browser-features'],
	rules: {
		'no-unknown-animations': true,
		'font-family-name-quotes': 'always-unless-keyword',
		'font-weight-notation': 'numeric',
		'selector-nested-pattern': '(.*&(?![-_][^-_]).*)|(^[^&]*$)',
		'value-no-vendor-prefix': [
			true,
			{
				ignoreValues: ['optimize-contrast'],
			},
		],
		'selector-no-vendor-prefix': true,
		'media-feature-name-no-vendor-prefix': true,
		'at-rule-no-vendor-prefix': true,
		'selector-max-id': 0,
		'declaration-block-single-line-max-declarations': 1,
		'declaration-block-no-duplicate-properties': [
			true,
			{
				ignoreProperties: ['cursor', 'justify-content'],
			},
		],
		'selector-pseudo-element-no-unknown': null,
		'function-url-quotes': 'always',
		'property-no-vendor-prefix': null,
		'no-descending-specificity': null,
		'block-no-empty': null,
		'color-no-hex': true,
		'color-named': 'never',
		'function-disallowed-list': ['hsl', 'hsla'],
		'plugin/no-unsupported-browser-features': [
			true,
			{
				ignore: [
					'css-unset-value',
					'css-resize', // прогрессивное улучшение
					'css-hyphens', // прогрессивное улучшение
					'css3-cursors', // прогрессивное улучшение
					'css3-cursors-newer', // прогрессивное улучшение
					'will-change', // прогрессивное улучшение
					'css-touch-action', // прогрессивное улучшение
					'pointer', // прогрессивное улучшение
					'css-gradients',
				],
				ignorePartialSupport: true,
			},
		],
	},
};
