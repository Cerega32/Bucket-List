// конфиг для npm test и прекоммит хука
// запускает полную проверку, включая ./stylelint.config.js
// правила, которые находятся в этом файле - fixable, т.е. могут быть пофикшены автоматически

module.exports = {
	extends: './stylelint.config.js',
	rules: {
		'shorthand-property-no-redundant-values': true,
		'function-name-case': 'lower',
		'length-zero-no-unit': [true, {ignore: ['custom-properties']}],
		'value-keyword-case': 'lower',
		'selector-pseudo-element-colon-notation': 'double',
		'selector-type-case': 'lower',
		'rule-empty-line-before': [
			'always',
			{
				ignore: ['after-comment'],
			},
		],

		'at-rule-empty-line-before': [
			'always',
			{
				except: ['after-same-name'],
				ignore: ['after-comment', 'first-nested'],
				ignoreAtRules: ['media', 'if', 'else', 'mixin', 'font-face'],
			},
		],
		'order/order': [
			'custom-properties',
			'dollar-variables',
			{
				type: 'at-rule',
				name: 'include',
			},
			'declarations',
			{
				type: 'at-rule',
				name: 'media',
			},
			{
				type: 'rule',
				selector: '^&::?\\w',
			},
			{
				type: 'rule',
				selector: '^[^&]',
			},
			{
				type: 'rule',
				selector: '^[^&]',
			},
			{
				type: 'rule',
				selector: '^&__',
			},
			{
				type: 'rule',
				selector: '^&--',
			},
		],
	},
};
