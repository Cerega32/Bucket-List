import {FC, FormEvent, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {Card} from '@/components/Card/Card';
import {CatalogItemsSkeleton} from '@/components/CatalogItems/CatalogItemsSkeleton';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {MainCards} from '@/components/MainCards/MainCards';
import {Svg} from '@/components/Svg/Svg';
import {User100GoalsSkeleton} from '@/containers/User100Goals/User100GoalsSkeleton';
import {useBem} from '@/hooks/useBem';
import {ICategoryGoals, IMainGoals} from '@/store/UserStore';
import {IComplexity, IGoal} from '@/typings/goal';
import {checkEmail} from '@/utils/api/get/checkEmail';
import {checkUsername} from '@/utils/api/get/checkUsername';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {getPopularGoalsForAllTime} from '@/utils/api/get/getPopularGoalsForAllTime';
import {postRegistration} from '@/utils/api/post/postRegistration';
import {registrationGoalsSync} from '@/utils/api/post/registrationGoalsSync';
import {normalizeEmail} from '@/utils/text/normalizeEmail';

import {Title} from '../Title/Title';
import './registration.scss';

const TOTAL_STEPS = 3;

interface RegistrationProps {
	className?: string;
	successRegistration: (data: {name: string; email_confirmed?: boolean; email?: string}) => void;
	isPage?: boolean;
}

export const Registration: FC<RegistrationProps> = (props) => {
	const {className, successRegistration, isPage} = props;

	const [block, element] = useBem('registration', className);
	const [step, setStep] = useState(1);
	const formRef = useRef<HTMLFormElement>(null);
	const [mainGoals, setMainGoals] = useState<IMainGoals>({
		easyGoals: {data: [], countCompleted: 0},
		mediumGoals: {data: [], countCompleted: 0},
		hardGoals: {data: [], countCompleted: 0},
	});
	const [mainGoalsLoading, setMainGoalsLoading] = useState(false);
	const [mainGoalsLoaded, setMainGoalsLoaded] = useState(false);
	const [completedGoalCodes, setCompletedGoalCodes] = useState<Set<string>>(new Set());
	const [catalogGoals, setCatalogGoals] = useState<Array<IGoal>>([]);
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [catalogLoaded, setCatalogLoaded] = useState(false);
	const [addedCatalogCodes, setAddedCatalogCodes] = useState<Set<string>>(new Set());
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [privacyConsent, setPrivacyConsent] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<{
		email?: Array<string>;
		username?: Array<string>;
		password?: Array<string>;
		repeatPassword?: Array<string>;
		non_field_errors?: Array<string>;
	}>({});
	const [generalError, setGeneralError] = useState('');
	const [, setIsCheckingUsername] = useState(false);
	const [, setIsCheckingEmail] = useState(false);

	useEffect(() => {
		if (!mainGoalsLoaded && !mainGoalsLoading) {
			setMainGoalsLoading(true);
			(async () => {
				const res = await get100Goals();
				if (res.success) setMainGoals(res.data);
				setMainGoalsLoaded(true);
				setMainGoalsLoading(false);
			})();
		}
	}, []);

	useEffect(() => {
		if (step === 2 && !catalogLoaded && !catalogLoading) {
			setCatalogLoading(true);
			(async () => {
				const res = await getPopularGoalsForAllTime(16);
				if (res.success) setCatalogGoals(res.data ?? []);
				setCatalogLoaded(true);
				setCatalogLoading(false);
			})();
		}
	}, [step]);

	const updateMainGoal = (_i: number, complexity: IComplexity, code: string, done: boolean) => {
		const key = `${complexity}Goals` as keyof IMainGoals;
		const target = mainGoals[key] as ICategoryGoals;
		const idx = target.data.findIndex((g) => g.code === code);
		if (idx === -1) return;

		const newGoals: ICategoryGoals = {
			data: target.data.map((g, i) => (i === idx ? {...g, completedByUser: !done} : g)),
			countCompleted: target.countCompleted + (done ? -1 : 1),
		};
		setMainGoals({...mainGoals, [key]: newGoals});

		setCompletedGoalCodes((prev) => {
			const next = new Set(prev);
			if (done) {
				next.delete(code);
			} else {
				next.add(code);
			}
			return next;
		});
	};

	const updateCatalogGoal = (code: string, i: number, add: boolean) => {
		setCatalogGoals((prev) => prev.map((g, idx) => (idx === i ? {...g, addedByUser: add} : g)));
		setAddedCatalogCodes((prev) => {
			const next = new Set(prev);
			if (add) {
				next.add(code);
			} else {
				next.delete(code);
			}
			return next;
		});
	};

	const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
	const goBack = () => setStep((s) => Math.max(s - 1, 1));
	const skipStep = () => setStep(3);

	const validateUsername = (name: string): Array<string> => {
		const trimmed = name.trim();
		const errors: Array<string> = [];

		if (!trimmed) {
			errors.push('Введите имя пользователя');
		}

		if (trimmed.length > 0 && trimmed.length < 3) {
			errors.push('Минимальная длина имени пользователя - 3 символа');
		}

		if (trimmed.length > 0 && !/^[A-Za-z0-9_]+$/.test(trimmed)) {
			errors.push('Используйте только латинские буквы, цифры и знак подчёркивания');
		}

		return errors;
	};

	const checkUsernameAsync = async (name: string) => {
		const localErrors = validateUsername(name);
		if (localErrors.length > 0) {
			setError((prev) => ({...prev, username: localErrors}));
			return;
		}

		if (!name.trim()) return;

		setIsCheckingUsername(true);
		const res = await checkUsername(name.trim());
		setIsCheckingUsername(false);

		if (!res.success) {
			const serverErrors = Array.isArray(res.errors) ? res.errors : typeof res.errors === 'string' ? [res.errors] : undefined;

			if (serverErrors && serverErrors.length) {
				setError((prev) => ({...prev, username: serverErrors}));
			}
		} else {
			setError((prev) => ({...prev, username: []}));
		}
	};

	const checkEmailAsync = async (mail: string) => {
		const trimmed = mail.trim();
		if (!trimmed) {
			setError((prev) => ({...prev, email: undefined}));
			return;
		}

		setIsCheckingEmail(true);
		const res = await checkEmail(trimmed);
		setIsCheckingEmail(false);

		if (!res.success) {
			const serverErrors =
				(Array.isArray(res.errors) && res.errors) ||
				(Array.isArray(res.data?.errors) && res.data.errors) ||
				(typeof res.errors === 'string' ? [res.errors] : undefined);

			if (serverErrors && serverErrors.length) {
				setError((prev) => ({...prev, email: serverErrors}));
			}
		} else {
			setError((prev) => ({...prev, email: undefined}));
		}
	};

	const validatePassword = (pwd: string): Array<string> => {
		const trimmed = pwd;
		const errors: Array<string> = [];

		if (!trimmed) {
			errors.push('Введите пароль');
		} else if (trimmed.length < 8) {
			errors.push('Минимальная длина пароля - 8 символов');
		}

		return errors;
	};

	const validateRepeatPassword = (pwd: string, repeat: string): Array<string> => {
		const errors: Array<string> = [];

		if (!repeat) {
			errors.push('Повторите пароль');
		} else if (pwd !== repeat) {
			errors.push('Пароли не совпадают');
		}

		return errors;
	};

	const signUp = async (e?: FormEvent) => {
		e?.preventDefault();
		setError({});
		setGeneralError('');
		const normalizedEmail = email.trim().toLowerCase();
		const normalizedUsername = username.trim().toLowerCase();
		const usernameErrors = validateUsername(username);
		const passwordErrors = validatePassword(password);
		const repeatPasswordErrors = validateRepeatPassword(password, repeatPassword);

		if (usernameErrors.length || passwordErrors.length || repeatPasswordErrors.length) {
			setError({
				username: usernameErrors.length ? usernameErrors : undefined,
				password: passwordErrors.length ? passwordErrors : undefined,
				repeatPassword: repeatPasswordErrors.length ? repeatPasswordErrors : undefined,
				email: error.email,
			});
			return;
		}
		setIsLoading(true);
		const res = await postRegistration(normalizeEmail(normalizedEmail), password, normalizedUsername);
		if (res.success) {
			if (addedCatalogCodes.size > 0 || completedGoalCodes.size > 0) {
				try {
					await registrationGoalsSync({
						add_codes: Array.from(addedCatalogCodes),
						mark_codes: Array.from(completedGoalCodes),
					});
				} catch (syncError) {
					console.error('Failed to sync goals after registration', syncError);
				}
			}

			successRegistration(res.data ?? res);
			setIsLoading(false);
			return;
		}
		setIsLoading(false);
		if (res.errors) {
			if (typeof res.errors === 'object' && !Array.isArray(res.errors)) {
				setError(res.errors);
				if (Array.isArray(res.errors.non_field_errors)) {
					setGeneralError(res.errors.non_field_errors[0]);
				}
			} else if (typeof res.errors === 'string') {
				setGeneralError(res.errors);
			} else if (Array.isArray(res.errors)) {
				setGeneralError(res.errors[0] ?? 'Произошла ошибка при регистрации');
			} else {
				setGeneralError('Произошла ошибка при регистрации');
			}
		} else {
			setGeneralError(res.error ?? 'Произошла ошибка при регистрации');
		}
	};

	const handleSubmitClick = () => {
		formRef.current?.requestSubmit();
	};

	const circumference = 2 * Math.PI * 18;
	const progressOffset = circumference - (step / TOTAL_STEPS) * circumference;
	const usernameErrors = validateUsername(username);
	const passwordErrors = validatePassword(password);
	const repeatPasswordErrors = validateRepeatPassword(password, repeatPassword);
	const hasErrors = !!(usernameErrors.length || passwordErrors.length || repeatPasswordErrors.length || error.email?.length);

	const isFormValid = !!(email.trim() && username.trim() && password.trim() && repeatPassword.trim() && privacyConsent && !hasErrors);

	return (
		<div className={block({page: isPage})}>
			<div className={element('scroll')}>
				<div className={element('brand')}>
					<Svg icon="delting" width="120px" height="30px" className={element('brand-logo')} />
				</div>

				{/* Step 1: 100 goals */}
				<div className={element('step', {active: step === 1})}>
					<Title tag="h1" className={element('step-title')}>
						Посмотрите на свои 100 целей
					</Title>
					<p className={element('step-desc')}>
						Отметьте то, что вы уже сделали, чтобы увидеть свой текущий прогресс. Необязательно отмечать всё сейчас — это можно
						изменить позже
					</p>
					{mainGoalsLoading && <User100GoalsSkeleton withStats={false} />}
					{!mainGoalsLoading && mainGoalsLoaded && mainGoals.easyGoals.data.length === 0 && (
						<div className={element('empty')}>
							<p>Список 100 целей будет доступен в личном кабинете после регистрации</p>
						</div>
					)}
					{!mainGoalsLoading && mainGoals.easyGoals.data.length > 0 && (
						<div className={element('main-goals-wrap')}>
							<MainCards
								className={element('main-goals')}
								goals={mainGoals.easyGoals.data}
								complexity="easy"
								withBtn
								updateGoal={updateMainGoal}
								disableNavigation
								topInfoClassName="gradient__top-info--main-goals"
							/>
							<MainCards
								className={element('main-goals')}
								goals={mainGoals.mediumGoals.data}
								complexity="medium"
								withBtn
								updateGoal={updateMainGoal}
								disableNavigation
								topInfoClassName="gradient__top-info--main-goals"
							/>
							<MainCards
								className={element('main-goals')}
								goals={mainGoals.hardGoals.data}
								complexity="hard"
								withBtn
								updateGoal={updateMainGoal}
								disableNavigation
								topInfoClassName="gradient__top-info--main-goals"
							/>
						</div>
					)}
				</div>

				{/* Step 2: Catalog goals */}
				<div className={element('step', {active: step === 2})}>
					<Title tag="h1" className={element('step-title')}>
						Добавьте цели из каталога
					</Title>
					<p className={element('step-desc')}>В каталоге есть сотни идей по категориям — от путешествий до саморазвития</p>
					{catalogLoading ? (
						<CatalogItemsSkeleton />
					) : (
						<section className={element('catalog-goals')}>
							{catalogGoals.map((goal, i) => (
								<Card
									key={goal.code}
									className={element('catalog-goal')}
									goal={goal}
									onClickAdd={async () => updateCatalogGoal(goal.code, i, true)}
									onClickDelete={async () => updateCatalogGoal(goal.code, i, false)}
									onClickMark={async () => {}}
									disableNavigation
									disableMark
									allowAddWithoutAuth
								/>
							))}
						</section>
					)}
				</div>

				{/* Step 3: Registration form */}
				<div className={element('step', {active: step === 3})}>
					<Title tag="h1" className={element('step-title')}>
						Сохраните свой прогресс
					</Title>
					<p className={element('step-desc')}>
						{completedGoalCodes.size === 0 && addedCatalogCodes.size === 0 ? (
							<>
								Вы отметили 0 целей и добавили 0 из каталога, создайте аккаунт, чтобы начать формировать свой список и
								получать личные рекомендации
							</>
						) : (
							<>
								Вы уже отметили {completedGoalCodes.size} целей и добавили {addedCatalogCodes.size} из каталога, создайте
								аккаунт, чтобы не потерять отмеченные цели и отслеживать прогресс
							</>
						)}
					</p>

					<form ref={formRef} className={element('form')} onSubmit={signUp}>
						{generalError && <p className={element('error')}>{generalError}</p>}
						<FieldInput
							placeholder="Придумайте имя пользователя"
							type="text"
							id="username"
							text="Имя пользователя"
							value={username}
							setValue={(val) => {
								setUsername(val);
								setError((prev) => ({...prev, username: validateUsername(val)}));
							}}
							onBlur={() => checkUsernameAsync(username)}
							className={`${element('field')} ${element('field-with-icons')}`}
							autoComplete="username"
							error={error?.username}
							required
							minLength={3}
							iconBegin="user"
							hint={!error?.username || error.username.length === 0 ? 'Будет отображаться в вашем профиле' : undefined}
						/>
						<FieldInput
							placeholder="E-mail"
							type="email"
							id="email"
							text="Email"
							value={email}
							setValue={(val) => {
								setEmail(val);
							}}
							onBlur={() => checkEmailAsync(email)}
							className={`${element('field')} ${element('field-with-icons')}`}
							autoComplete="email"
							error={error?.email}
							required
							iconBegin="email"
						/>
						<FieldInput
							placeholder="Пароль для входа"
							id="new-password"
							text="Пароль"
							value={password}
							setValue={(val) => {
								setPassword(val);
								setError((prev) => ({
									...prev,
									password: validatePassword(val),
									repeatPassword: validateRepeatPassword(val, repeatPassword),
								}));
							}}
							className={`${element('field')} ${element('field-with-icons')}`}
							type="password"
							autoComplete="new-password"
							required
							error={error.password}
							iconBegin="lock"
						/>
						<FieldInput
							placeholder="Повтор ввода пароля"
							id="repeatPassword"
							text="Повторите пароль"
							value={repeatPassword}
							setValue={(val) => {
								setRepeatPassword(val);
								setError((prev) => ({
									...prev,
									repeatPassword: validateRepeatPassword(password, val),
								}));
							}}
							className={`${element('field')} ${element('field-with-icons')}`}
							type="password"
							autoComplete="new-password"
							required
							error={error.repeatPassword}
							iconBegin="lock"
						/>
						<div className={element('consent')}>
							<FieldCheckbox
								id="privacy-consent"
								text={
									<div>
										Даю согласие на обработку моих персональных данных в соответствии с{' '}
										<Link to="/privacy" className={element('consent-link')} target="_blank" rel="noopener noreferrer">
											Политикой конфиденциальности
										</Link>
									</div>
								}
								checked={privacyConsent}
								setChecked={setPrivacyConsent}
								className={element('consent-checkbox')}
							/>
						</div>
					</form>
				</div>
			</div>

			{/* Footer navigation */}
			<div className={element('footer')}>
				<Button
					theme="blue-light"
					icon="arrow--bottom"
					className={element('footer-back', {hidden: step === 1})}
					onClick={goBack}
					width="auto"
				>
					Назад
				</Button>

				<div className={element('step-indicator')}>
					<div className={element('step-rocket-wrap')}>
						<Svg icon="rocket" className={element('step-rocket-icon')} />
						<svg viewBox="0 0 40 40" className={element('step-progress-svg')}>
							<circle cx="20" cy="20" r="18" fill="none" strokeWidth={3} className={element('step-progress-bg')} />
							<circle
								cx="20"
								cy="20"
								r="18"
								fill="none"
								strokeWidth={3}
								strokeDasharray={circumference}
								strokeDashoffset={progressOffset}
								strokeLinecap="round"
								transform="rotate(-90 20 20)"
								className={element('step-progress-fill')}
							/>
						</svg>
					</div>
					<span className={element('step-text')}>
						<span className={element('step-text-label')}>Шаг </span>
						<span className={element('step-text-number')}>{`${step} из ${TOTAL_STEPS}`}</span>
					</span>
				</div>

				{step < TOTAL_STEPS ? (
					<div className={element('footer-actions')}>
						<Button theme="blue-light" className={element('footer-skip')} onClick={skipStep} width="auto">
							Пропустить
						</Button>
						<Button theme="blue" onClick={goNext} width="auto">
							Далее
						</Button>
					</div>
				) : (
					<Button
						theme="blue"
						className={element('footer-submit')}
						onClick={handleSubmitClick}
						disabled={!isFormValid}
						loading={isLoading}
						loadingText="Регистрация"
						width="auto"
					>
						Создать аккаунт и сохранить
					</Button>
				)}
			</div>
		</div>
	);
};
