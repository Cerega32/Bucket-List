export interface ILegalDocumentLink {
	to: string;
	label: string;
}

export const LEGAL_DOCUMENT_LINKS: ILegalDocumentLink[] = [
	{to: '/privacy', label: 'Политика конфиденциальности'},
	{to: '/agreement', label: 'Пользовательское соглашение'},
	{to: '/consent', label: 'Согласие на обработку персональных данных'},
	{to: '/terms', label: 'Условия использования'},
	{to: '/subscription-offer', label: 'Оферта Premium'},
	{to: '/subscription-refund', label: 'Возврат и отмена подписки'},
	{to: '/cookies', label: 'Политика cookie'},
];
