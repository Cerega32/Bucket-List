import {FC} from 'react';
import {Link} from 'react-router-dom';

import {resetCookieConsent} from '@/shared/config/legal/cookieConsent';
import {OPERATOR_EMAIL, YANDEX_METRIKA_POLICY_URL, YANDEX_METRIKA_TERMS_URL} from '@/shared/config/legal/operatorInfo';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {LegalDocument} from '@/widgets/legal-document/LegalDocument';

import '@/widgets/cookies-policy/cookies-container.scss';

export const CookiesContainer: FC = () => {
	const [, element] = useBem('cookies-container');

	return (
		<LegalDocument title="Политика использования Cookie">
			<section>
				<h2>1. Что такое Cookie</h2>
				<p>
					Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве (компьютере, планшете, смартфоне)
					при посещении веб-сайта. Они помогают Платформе запоминать ваши действия и предпочтения на определённый период времени.
				</p>
				<p>
					IP-адрес — номер, который автоматически присваивается устройству провайдером интернет-услуг. Он регистрируется при
					посещении Сайта вместе со временем визита и просмотренными страницами.
				</p>
			</section>

			<section>
				<h2>2. Как мы используем Cookie</h2>
				<p>Платформа Delting использует файлы cookie следующих категорий:</p>
				<ul>
					<li>
						<strong>Обязательные cookie</strong> — необходимы для работы основных функций Платформы (авторизация, безопасность,
						сохранение сессии, защита от CSRF). Без них Платформа не сможет функционировать должным образом. Устанавливаются без
						отдельного согласия, так как необходимы для оказания услуги;
					</li>
					<li>
						<strong>Функциональные cookie</strong> — помогают запомнить ваши предпочтения (например, тема оформления, настройки
						отображения);
					</li>
					<li>
						<strong>Аналитические cookie</strong> — используются сервисом Яндекс.Метрика для анализа посещаемости и поведения на
						Сайте. Устанавливаются <strong>только после нажатия «Принять»</strong> в баннере cookie;
					</li>
					<li>
						<strong>Cookie для безопасности</strong> — помогают обнаруживать и предотвращать несанкционированный доступ.
					</li>
				</ul>
			</section>

			<section>
				<h2>3. Перечень используемых Cookie</h2>
				<p>Мы используем следующие cookie и аналогичные технологии:</p>
				<ul>
					<li>
						<strong>token</strong> (httpOnly) — обязательный — аутентификация пользователя;
					</li>
					<li>
						<strong>is_authenticated</strong> — обязательный — маркер состояния авторизации;
					</li>
					<li>
						<strong>csrftoken</strong> — обязательный — защита от межсайтовых подделок запросов;
					</li>
					<li>
						<strong>user-id</strong>, <strong>avatar</strong> — функциональные — отображение профиля в интерфейсе;
					</li>
					<li>
						<strong>cookie_consent</strong> (localStorage) — запоминание вашего выбора в баннере cookie;
					</li>
					<li>
						<strong>analytics_session_id</strong> (localStorage) — обязательный/сервисный — анонимный идентификатор сессии для
						сервисной статистики воронки регистрации на стороне Оператора (не передаётся в Яндекс.Метрику);
					</li>
					<li>
						<strong>_ym_uid</strong>, <strong>_ym_d</strong> — аналитические — идентификатор посетителя Яндекс.Метрики;
					</li>
					<li>
						<strong>_ym_visorc</strong>, <strong>_ym_isad</strong> — аналитические — работа Вебвизора и учёт визитов
						Яндекс.Метрики.
					</li>
				</ul>
				<p>
					Срок хранения cookie зависит от типа: сессионные удаляются при закрытии браузера; аналитические cookie Яндекс.Метрики
					хранятся до 1 года или до удаления вами в настройках браузера.
				</p>
			</section>

			<section>
				<h2>4. Управление Cookie</h2>
				<p>Вы можете управлять cookie следующими способами:</p>
				<ul>
					<li>
						<strong>Баннер на Сайте</strong> — при первом посещении выберите «Принять» или «Отклонить» аналитические cookie;
					</li>
					<li>
						<strong>Настройки cookie на Сайте</strong> — в любой момент измените выбор через пункт «Настройки cookie» в футере
						или кнопку ниже;
					</li>
					<li>
						<strong>Настройки браузера</strong> — просмотр, блокировка или удаление cookie (см. инструкции ниже).
					</li>
				</ul>
				<div className={element('settings-action')}>
					<Button theme="blue-light" typeBtn="button" onClick={resetCookieConsent}>
						Изменить настройки cookie
					</Button>
				</div>
				<p>
					Отключение обязательных cookie может сделать невозможным вход в аккаунт и использование Платформы. Отключение
					аналитических cookie не влияет на основной функционал.
				</p>
				<p>Инструкции по управлению cookie в популярных браузерах:</p>
				<ul>
					<li>
						<strong>Google Chrome:</strong> Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов
					</li>
					<li>
						<strong>Mozilla Firefox:</strong> Настройки → Приватность и защита → Файлы cookie и данные сайтов
					</li>
					<li>
						<strong>Safari:</strong> Настройки → Конфиденциальность → Файлы cookie и данные веб-сайтов
					</li>
					<li>
						<strong>Microsoft Edge:</strong> Настройки → Файлы cookie и разрешения сайтов
					</li>
				</ul>
			</section>

			<section>
				<h2>5. Яндекс.Метрика</h2>
				<p>
					Мы используем сервис <strong>Яндекс.Метрика</strong> (ООО «Яндекс») для сбора статистики посещений и анализа поведения
					пользователей на Сайте. Скрипт Метрики загружается <strong>только после вашего согласия</strong> в баннере cookie.
				</p>
				<p>
					Отдельно от Метрики Оператор ведёт <strong>сервисную статистику воронки регистрации</strong> на своих серверах (открытие
					формы регистрации, успешная регистрация). Она нужна для оценки конверсии и улучшения онбординга, не зависит от согласия
					на аналитические cookie и не передаётся в Яндекс.
				</p>
				<p>При согласии Метрика может собирать:</p>
				<ul>
					<li>просмотры страниц, URL, время на сайте;</li>
					<li>IP-адрес, регион, тип браузера и устройства;</li>
					<li>клики, прокрутку, переходы по ссылкам;</li>
					<li>
						данные <strong>Вебвизора</strong> — запись действий на Сайте для анализа проблем в интерфейсе и причин ухода
						пользователей.
					</li>
				</ul>
				<p>
					Политика конфиденциальности Яндекса:{' '}
					<a href={YANDEX_METRIKA_POLICY_URL} target="_blank" rel="noopener noreferrer">
						yandex.ru/legal/confidential
					</a>
					. Условия использования Метрики:{' '}
					<a href={YANDEX_METRIKA_TERMS_URL} target="_blank" rel="noopener noreferrer">
						yandex.ru/legal/metrica_termsofuse
					</a>
					.
				</p>
			</section>

			<section>
				<h2>6. Изменения в Политике использования Cookie</h2>
				<p>
					Мы оставляем за собой право вносить изменения в настоящую Политику. Все изменения вступают в силу с момента публикации
					новой версии на Платформе.
				</p>
				<p>При внесении существенных изменений пользователи могут быть уведомлены через Платформу или по электронной почте.</p>
			</section>

			<section>
				<h2>7. Контактная информация</h2>
				<p>
					По вопросам использования cookie обращайтесь:
					<br />
					Email: <Link to={`mailto:${OPERATOR_EMAIL}`}>{OPERATOR_EMAIL}</Link>
				</p>
				<p>
					См. также: <Link to="/privacy">Политика конфиденциальности</Link>,{' '}
					<Link to="/consent">Согласие на обработку персональных данных</Link>.
				</p>
			</section>
		</LegalDocument>
	);
};
