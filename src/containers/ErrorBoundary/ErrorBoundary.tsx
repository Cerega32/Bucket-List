import React, {ErrorInfo} from 'react';

type ErrorBoundaryProps = {
	children: JSX.Element;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {hasError: false};
	}

	static getDerivedStateFromError(): ErrorBoundaryState {
		return {hasError: true};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	render(): React.ReactNode {
		const {children} = this.props;
		const {hasError} = this.state;

		return hasError ? 'ОШИБКА' : children;
	}
}
