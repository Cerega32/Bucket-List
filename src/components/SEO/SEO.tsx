import {FC} from 'react';
import {Helmet} from 'react-helmet-async';

interface SEOProps {
	title: string;
	description?: string;
	image?: string;
	url?: string;
	type?: 'website' | 'article';
}

export const SEO: FC<SEOProps> = ({
	title,
	description = 'Delting - платформа для достижения целей и составления списков желаний',
	image = '/og-image.jpg', // Путь к изображению по умолчанию
	url = window.location.href,
	type = 'website',
}) => {
	// Убедимся, что image — это полный URL
	const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

	return (
		<Helmet>
			{/* Стандартные мета-теги */}
			<title>{title} | Delting</title>
			<meta name="description" content={description} />

			{/* Open Graph метатеги для Facebook и VK */}
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={fullImageUrl} />
			<meta property="og:url" content={url} />
			<meta property="og:type" content={type} />
			<meta property="og:site_name" content="Delting" />

			{/* Twitter Card метатеги */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={title} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={fullImageUrl} />

			{/* Telegram метатеги */}
			<meta property="telegram:title" content={title} />
			<meta property="telegram:description" content={description} />
			<meta property="telegram:image" content={fullImageUrl} />

			{/* VK метатеги (дополнительные) */}
			<meta property="vk:image" content={fullImageUrl} />
		</Helmet>
	);
};
