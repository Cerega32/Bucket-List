// конфиг для npm test и прекоммит хука
// запускает полную проверку, включая ./stylelint.config.js
// правила, которые находятся в этом файле - fixable, т.е. могут быть пофикшены автоматически

module.exports = {
    extends: './stylelint.config.js',
    plugins: [
        'stylelint-order',
    ],
    rules: {
        'shorthand-property-no-redundant-values': true,
        'color-hex-case': 'upper',
        'function-comma-space-after': 'always',
        'function-comma-space-before': 'never',
        'function-max-empty-lines': 0,
        'function-name-case': 'lower',
        'function-whitespace-after': 'always',
        'number-leading-zero': 'always',
        'string-quotes': 'double',
        'length-zero-no-unit': [true, {ignore: ['custom-properties']}],
        'unit-case': 'lower',
        'value-keyword-case': 'lower',
        'value-list-comma-space-after': 'always-single-line',
        'value-list-comma-space-before': 'never',
        'value-list-max-empty-lines': 0,
        'property-case': 'lower',
        'declaration-bang-space-after': 'never',
        'declaration-bang-space-before': 'always',
        'declaration-colon-newline-after': 'always-multi-line',
        'declaration-colon-space-after': 'always-single-line',
        'declaration-colon-space-before': 'never',
        'declaration-block-semicolon-newline-after': 'always',
        'declaration-block-semicolon-space-before': 'never',
        'declaration-block-trailing-semicolon': 'always',
        'block-closing-brace-empty-line-before': 'never',
        'block-closing-brace-newline-after': ['always', {
            ignoreAtRules: ['if', 'else'],
        }],
        'block-closing-brace-newline-before': 'always',
        'block-opening-brace-newline-after': 'always',
        'block-opening-brace-space-before': 'always',
        'selector-attribute-brackets-space-inside': 'never',
        'selector-attribute-operator-space-after': 'never',
        'selector-attribute-operator-space-before': 'never',
        'selector-combinator-space-after': 'always',
        'selector-combinator-space-before': 'always',
        'selector-descendant-combinator-no-non-space': true,
        'selector-pseudo-class-case': 'lower',
        'selector-pseudo-element-colon-notation': 'double',
        'selector-type-case': 'lower',
        'selector-list-comma-newline-after': 'always',
        'selector-list-comma-newline-before': 'never-multi-line',
        'rule-empty-line-before': ['always', {
            ignore: ['after-comment'],
        }],
        'media-feature-colon-space-after': 'always',
        'media-feature-colon-space-before': 'never',
        'media-feature-name-case': 'lower',
        'media-query-list-comma-newline-after': 'never-multi-line',
        'media-query-list-comma-space-after': 'always',
        'media-query-list-comma-space-before': 'never',
        'at-rule-empty-line-before': ['always', {
            except: ['after-same-name'],
            ignore: ['after-comment', 'first-nested'],
            ignoreAtRules: ['media', 'if', 'else', 'mixin', 'font-face'],
        }],
        'at-rule-name-case': 'lower',
        'at-rule-name-space-after': 'always',
        'at-rule-semicolon-newline-after': 'always',
        indentation: [4, {ignore: 'value'}],
        'no-eol-whitespace': true,
        'no-missing-end-of-source-newline': true,
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
        'order/properties-order': [
            [
                'all',
                {
                    groupName: 'Псевдоэлементы',
                    emptyLineBefore: 'always',
                    properties: ['content', 'quotes', 'counter-reset', 'counter-increment'],
                },
                {
                    groupName: 'Позиционирование',
                    emptyLineBefore: 'always',
                    properties: ['position', 'top', 'right', 'bottom', 'left', 'z-index'],
                },
                {
                    groupName: 'Блочная модель',
                    emptyLineBefore: 'always',
                    properties: ['display', 'float', 'clear', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content', 'align-items', 'align-content', 'columns', 'column-width', 'column-count', 'column-fill', 'column-gap', 'column-rule', 'column-rule-color', 'column-rule-style', 'column-rule-width', 'column-span', 'visibility', 'overflow', 'overflow-x', 'overflow-y', '-webkit-overflow-scrolling', 'clip', 'zoom', '-ms-flex', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-self', 'order'],
                },
                {
                    groupName: 'Размеры и отступы',
                    emptyLineBefore: 'always',
                    properties: ['box-sizing', 'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom', 'padding', 'padding-left', 'padding-top', 'padding-right', 'padding-bottom'],
                },
                {
                    groupName: 'Таблицы',
                    emptyLineBefore: 'always',
                    properties: ['table-layout', 'empty-cells', 'caption-side', 'border-spacing', 'border-collapse', 'list-style', 'list-style-position', 'list-style-type', 'list-style-image'],
                },
                {
                    groupName: 'Поведение',
                    emptyLineBefore: 'always',
                    properties: ['resize', 'cursor', 'user-select', 'nav-index', 'nav-left', 'nav-up', 'nav-right', 'nav-down', 'contain', 'will-change', 'transition', 'transition-delay', 'transition-timing-function', 'transition-duration', 'transition-property', 'transform', 'transform-origin', 'transform-style', 'backface-visibility', 'perspective', 'perspective-origin', 'animation', 'animation-name', 'animation-duration', 'animation-play-state', 'animation-timing-function', 'animation-delay', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'direction', 'text-align', 'text-align-last', 'vertical-align', 'white-space', 'text-decoration', 'text-decoration-color', 'text-decoration-line', 'text-decoration-style', 'text-emphasis', 'text-emphasis-color', 'text-emphasis-style', 'text-emphasis-position', 'text-indent', 'text-justify', 'text-transform', 'letter-spacing', 'word-spacing', 'writing-mode', 'text-outline', 'text-transform', 'text-wrap', 'text-overflow', 'text-overflow-ellipsis', 'text-overflow-mode', 'word-wrap', 'word-break', 'tab-size', 'hyphens', 'image-rendering', 'object-fit', 'object-position', 'pointer-events', 'appearance'],
                },
                {
                    groupName: 'Оформление',
                    emptyLineBefore: 'always',
                    properties: ['opacity', '-ms-interpolation-mode', 'color', 'border', 'border-collapse', 'border-width', 'border-style', 'border-color', 'border-left', 'border-left-width', 'border-left-style', 'border-left-color', 'border-top', 'border-top-width', 'border-top-style', 'border-top-color', 'border-right', 'border-right-width', 'border-right-style', 'border-right-color', 'border-bottom', 'border-bottom-width', 'border-bottom-style', 'border-bottom-color', 'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius', 'border-image', 'border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset', 'border-image-repeat', 'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset', 'background', 'background-color', 'background-image', 'background-repeat', 'background-attachment', 'background-position', 'background-position-x', 'background-position-y', 'background-clip', 'background-origin', 'background-size', 'box-decoration-break', 'box-shadow', 'text-shadow', 'filter'],
                },
                {
                    groupName: 'Шрифт',
                    emptyLineBefore: 'always',
                    properties: ['font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'font-size-adjust', 'font-stretch', 'font-effect', 'font-emphasize', 'font-emphasize-position', 'font-emphasize-style', 'font-smooth', 'line-height'],
                },
                {
                    groupName: 'Печать',
                    emptyLineBefore: 'always',
                    properties: ['marks', 'orphans', 'page-break-after', 'page-break-before', 'page-break-inside', 'widows'],
                },
            ],
            {
                unspecified: 'bottomAlphabetical',
            },
        ],
    },
};
