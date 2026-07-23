import React, {ErrorInfo} from 'react';

import {Button} from '@/shared/ui/Button/Button';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import '@/app/providers/ErrorBoundary/error-boundary.scss';

type ErrorBoundaryProps = {
	children: JSX.Element;
};

type ErrorBoundaryState = {
	hasError: boolean;
	error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {hasError: false, error: null};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {hasError: true, error};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	render(): React.ReactNode {
		const {children} = this.props;
		const {hasError, error} = this.state;

		if (!hasError) return children;

		return (
			<main className="error-boundary">
				<Title tag="h1">Что-то пошло не так</Title>
				<Title tag="h2">Произошла непредвиденная ошибка</Title>
				<p className="error-boundary__text">Попробуйте обновить страницу или вернуться на главную.</p>
				{error?.message && (
					<div className="error-boundary__details">
						<span className="error-boundary__details-label">Ошибка:</span>
						<p className="error-boundary__details-message">{error.message}</p>
					</div>
				)}
				<div className="error-boundary__actions">
					<Button
						theme="blue"
						size="medium"
						icon="refresh"
						className="error-boundary__btn"
						onClick={() => window.location.reload()}
					>
						Обновить страницу
					</Button>
					<a href="/" className="error-boundary__link">
						<Svg icon="bullseye" width="16px" height="16px" />
						На главную
					</a>
				</div>
			</main>
		);
	}
}
