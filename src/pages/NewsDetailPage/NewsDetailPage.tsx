import {observer} from 'mobx-react-lite';
import {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {Link, useParams} from 'react-router-dom';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import Lightbox from 'yet-another-react-lightbox';

import {NewsComments} from '@/components/NewsComments/NewsComments';
import {useBem} from '@/hooks/useBem';
import {newsStore} from '@/store/NewsStore';
import {ThemeStore} from '@/store/ThemeStore';
import {pluralize} from '@/utils/text/pluralize';
import './NewsDetailPage.scss';

export const NewsDetailPage = observer(() => {
	const {id} = useParams<{id: string}>();
	const [block, element] = useBem('news-detail-page');

	// Состояния для лайтбокса
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	useEffect(() => {
		// Устанавливаем тему страницы
		ThemeStore.setPage('isNewsDetail');
		ThemeStore.setHeader('white');
		ThemeStore.setFull(false);

		if (id) {
			const newsId = Number(id);
			newsStore.loadNewsDetail(newsId);
			newsStore.loadComments(newsId);
		}

		// Очистка при размонтировании
		return () => {
			ThemeStore.setPage('isMainPage');
		};
	}, [id]);

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleImageClick = (imageIndex: number) => {
		setLightboxIndex(imageIndex);
		setIsLightboxOpen(true);
	};

	const handleImageKeyDown = (event: React.KeyboardEvent, imageIndex: number) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			setLightboxIndex(imageIndex);
			setIsLightboxOpen(true);
		}
	};

	// Состояние загрузки
	if (newsStore.loading && !newsStore.currentNews) {
		return (
			<div className={block()}>
				<div className={element('container')}>
					<div className={element('loading')}>Загрузка новости...</div>
				</div>
			</div>
		);
	}

	// Ошибка загрузки
	if (newsStore.error && !newsStore.currentNews) {
		return (
			<div className={block()}>
				<div className={element('container')}>
					<div className={element('error')}>
						<p>Ошибка: {newsStore.error}</p>
						<button
							type="button"
							onClick={() => id && newsStore.loadNewsDetail(Number(id))}
							className={element('retry-button')}
						>
							Попробовать снова
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Новость не найдена
	if (!newsStore.currentNews && !newsStore.loading) {
		return (
			<div className={block()}>
				<div className={element('container')}>
					<div className={element('not-found')}>
						<h1>Новость не найдена</h1>
						<p>Запрашиваемая новость не существует или была удалена.</p>
						<Link to="/news" className={element('back-link')}>
							← Вернуться к новостям
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const news = newsStore.currentNews!;

	// Подготавливаем массив изображений для лайтбокса
	const allImages: string[] = [];

	// Добавляем главное изображение, если есть
	if (news.image || news.featuredImage) {
		allImages.push(news.image || news.featuredImage!);
	}

	// Добавляем дополнительные изображения, если есть
	if (news.images && news.images.length > 0) {
		allImages.push(...news.images);
	}

	// Преобразуем в формат для библиотеки Lightbox
	const lightboxSlides = allImages.map((imageUrl) => ({src: imageUrl}));

	return (
		<div className={block()}>
			<div className={element('container')}>
				{/* Навигация */}
				<div className={element('navigation')}>
					<Link to="/news" className={element('back-link')}>
						← Назад к новостям
					</Link>
				</div>

				{/* Статья */}
				<article className={element('article')}>
					<header className={element('header')}>
						<h1 className={element('title')}>{news.title}</h1>
						<div className={element('meta')}>
							<span className={element('author')}>
								{news.author?.firstName} {news.author?.lastName}
							</span>
							<span className={element('date')}>{formatDate(news.createdAt)}</span>
							<span className={element('comments-count')}>
								{pluralize(news.commentsCount, ['комментарий', 'комментария', 'комментариев'])}
							</span>
						</div>
					</header>

					{/* Главное изображение */}
					{(news.image || news.featuredImage) && (
						<div className={element('image')}>
							<button
								type="button"
								className={element('image-button')}
								onClick={() => handleImageClick(0)}
								onKeyDown={(e) => handleImageKeyDown(e, 0)}
								aria-label="Открыть изображение в полном размере"
							>
								<img src={news.image || news.featuredImage} alt={news.title} />
							</button>
						</div>
					)}

					{/* Дополнительные изображения */}
					{news.images && news.images.length > 0 && (
						<div className={element('images-gallery')}>
							{news.images.map((imageUrl, index) => {
								// Индекс в общем массиве (учитываем главное изображение)
								const globalIndex = news.image || news.featuredImage ? index + 1 : index;

								return (
									<div key={imageUrl} className={element('gallery-item')}>
										<button
											type="button"
											className={element('gallery-button')}
											onClick={() => handleImageClick(globalIndex)}
											onKeyDown={(e) => handleImageKeyDown(e, globalIndex)}
											aria-label="Открыть изображение в полном размере"
										>
											<img src={imageUrl} alt={`${news.title} - дополнительное изображение`} />
										</button>
									</div>
								);
							})}
						</div>
					)}

					{/* Контент */}
					<div className={element('content')}>
						{news.content ? (
							<div className={element('content-markdown')}>
								<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
									{news.content}
								</ReactMarkdown>
							</div>
						) : news.excerpt ? (
							<div className={element('content-text')}>{news.excerpt}</div>
						) : (
							<div className={element('content-text')}>Контент недоступен</div>
						)}
					</div>

					{/* Дата обновления */}
					{news.updatedAt !== news.createdAt && (
						<div className={element('updated')}>
							<small>Обновлено: {formatDate(news.updatedAt)}</small>
						</div>
					)}
				</article>

				{/* Комментарии */}
				{id && <NewsComments newsId={Number(id)} />}

				{/* Лайтбокс для просмотра изображений */}
				<Lightbox
					open={isLightboxOpen}
					close={() => setIsLightboxOpen(false)}
					slides={lightboxSlides}
					index={lightboxIndex}
					carousel={{finite: true, padding: '16px'}}
					controller={{closeOnBackdropClick: true}}
					animation={{fade: 300}}
					styles={{container: {backgroundColor: 'rgba(0, 0, 0, .8)'}}}
				/>
			</div>
		</div>
	);
});
