import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './content-goal.scss';
import {ListGoals} from '../ListGoals/ListGoals';
import {CommentGoal} from '../CommentGoal/CommentGoal';

interface ContentGoalProps {
	className?: string;
}

const goal1 = {
	img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAAAAAXNSR0IArs4c6QAAAi9JREFUeF7t3MFRwzAABVFSA/RfBIXQEgxwY4AkGjvWyo+z7ax39QMnLq8vb+9PfrIGLgJm232BC9juJ2C8n4AC1g3E+f0OFDBuII5vgQLGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8C1wm4Oc/G7kMvs299957/SDWHLdt/LI/HmeBc1QephBwWN0cNwo4R4dhio0Dbvx9P/xa57lx44C3iBP5Fku3XnN5fX57H/7r89ZPuXqdqKOKDljgb6gCXg34xwUHBBRrNNZv9x0QcEv8mZ51zMFcI+Ax7qY4PWsEvKpy3cInCXi1cPYCAbPpvsFPFXDFL9KdA66obK7J7hNQt4dV3ifgw/B9kIDxMyCggBMbOMHv4v0WOLW8qeHuWsR+Ae/C2PvidYL9NHWSgHsfkOOeP0fAdQeye9k5Am76muc6DQsG3PQ0TP8wAadP9D+ggALGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8CxQwbiCOb4ECxg3E8S1QwLiBOL4FChg3EMe3QAHjBuL4Fihg3EAc3wIFjBuI41tgPOAHo8I30I61Bo0AAAAASUVORK5CYII=',
	title: 'Пора путешествовать по-другому',
	text: 'Руслан Усачев. Ютуб-блогер с аудиторией канала 2.7М человек. Создатель и ведущий тревел-шоу «Пора валить». И вообще со всех сторон красивый человек.',
};

const goals = [goal1, goal1, goal1, goal1];

export const ContentGoal: FC<ContentGoalProps> = (props) => {
	const {className} = props;

	const [block, element] = useBem('content-goal', className);

	return (
		<main className={block()}>
			<section className={element('info')}>
				<div className={element('info-item')}>
					<span className={element('info-title')}>Сложность</span>
					<span className={element('info-text')}>Легко</span>
				</div>
				<div className={element('vertical-line')} />
				<div className={element('info-item')}>
					<span className={element('info-title')}>Людей взяли</span>
					<span className={element('info-text')}>1821</span>
				</div>
				<div className={element('vertical-line')} />
				<div className={element('info-item')}>
					<span className={element('info-title')}>Выполнили</span>
					<span className={element('info-text')}>213</span>
				</div>
				<div className={element('vertical-line')} />
				<div className={element('info-item')}>
					<span className={element('info-title')}>
						Процент выполнения
					</span>
					<span className={element('info-text')}>12%</span>
				</div>
			</section>
			<section className={element('section')}>
				<h2 className={element('title-section')}>
					Списки с целью&nbsp;
					<span className={element('title-counter')}>5</span>
				</h2>
				<section className={element('list-goals')}>
					{goals.map((goal) => (
						<ListGoals
							img={goal.img}
							text={goal.text}
							title={goal.title}
							className={element('item-list-goals')}
						/>
					))}
				</section>
			</section>
			<section>
				<h2 className={element('title-section')}>
					Отметки выполнения&nbsp;
					<span className={element('title-counter')}>256</span>
				</h2>
				<section className={element('comments-goals')}>
					{/* {goals.map((goal) => ( */}
					<CommentGoal
						user={{
							avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAAAAAXNSR0IArs4c6QAAAi9JREFUeF7t3MFRwzAABVFSA/RfBIXQEgxwY4AkGjvWyo+z7ax39QMnLq8vb+9PfrIGLgJm232BC9juJ2C8n4AC1g3E+f0OFDBuII5vgQLGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8C1wm4Oc/G7kMvs299957/SDWHLdt/LI/HmeBc1QephBwWN0cNwo4R4dhio0Dbvx9P/xa57lx44C3iBP5Fku3XnN5fX57H/7r89ZPuXqdqKOKDljgb6gCXg34xwUHBBRrNNZv9x0QcEv8mZ51zMFcI+Ax7qY4PWsEvKpy3cInCXi1cPYCAbPpvsFPFXDFL9KdA66obK7J7hNQt4dV3ifgw/B9kIDxMyCggBMbOMHv4v0WOLW8qeHuWsR+Ae/C2PvidYL9NHWSgHsfkOOeP0fAdQeye9k5Am76muc6DQsG3PQ0TP8wAadP9D+ggALGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8CxQwbiCOb4ECxg3E8S1QwLiBOL4FChg3EMe3QAHjBuL4Fihg3EAc3wIFjBuI41tgPOAHo8I30I61Bo0AAAAASUVORK5CYII=',
							name: 'Анастасия Волочкова',
							level: 8,
							countGoals: 250,
						}}
						comment={{
							text: 'Я недавно побывал в Тегеране и могу сказать, что это было удивительное путешествие! Город полон разнообразия и ярких красок, а люди там настолько дружелюбны, что создают впечатление, будто ты вернулся домой. Тегеран - это настоящий оазис в пустыне, где можно погрузиться в культуру и историю Ирана. Одним словом, это путешествие оставило яркие впечатления и я с нетерпением жду, когда снова смогу посетить этот прекрасный город.',
							images: [
								'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAAAAAXNSR0IArs4c6QAAAi9JREFUeF7t3MFRwzAABVFSA/RfBIXQEgxwY4AkGjvWyo+z7ax39QMnLq8vb+9PfrIGLgJm232BC9juJ2C8n4AC1g3E+f0OFDBuII5vgQLGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8C1wm4Oc/G7kMvs299957/SDWHLdt/LI/HmeBc1QephBwWN0cNwo4R4dhio0Dbvx9P/xa57lx44C3iBP5Fku3XnN5fX57H/7r89ZPuXqdqKOKDljgb6gCXg34xwUHBBRrNNZv9x0QcEv8mZ51zMFcI+Ax7qY4PWsEvKpy3cInCXi1cPYCAbPpvsFPFXDFL9KdA66obK7J7hNQt4dV3ifgw/B9kIDxMyCggBMbOMHv4v0WOLW8qeHuWsR+Ae/C2PvidYL9NHWSgHsfkOOeP0fAdQeye9k5Am76muc6DQsG3PQ0TP8wAadP9D+ggALGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8CxQwbiCOb4ECxg3E8S1QwLiBOL4FChg3EMe3QAHjBuL4Fihg3EAc3wIFjBuI41tgPOAHo8I30I61Bo0AAAAASUVORK5CYII=',
								'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAAAAAXNSR0IArs4c6QAAAi9JREFUeF7t3MFRwzAABVFSA/RfBIXQEgxwY4AkGjvWyo+z7ax39QMnLq8vb+9PfrIGLgJm232BC9juJ2C8n4AC1g3E+f0OFDBuII5vgQLGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8C1wm4Oc/G7kMvs299957/SDWHLdt/LI/HmeBc1QephBwWN0cNwo4R4dhio0Dbvx9P/xa57lx44C3iBP5Fku3XnN5fX57H/7r89ZPuXqdqKOKDljgb6gCXg34xwUHBBRrNNZv9x0QcEv8mZ51zMFcI+Ax7qY4PWsEvKpy3cInCXi1cPYCAbPpvsFPFXDFL9KdA66obK7J7hNQt4dV3ifgw/B9kIDxMyCggBMbOMHv4v0WOLW8qeHuWsR+Ae/C2PvidYL9NHWSgHsfkOOeP0fAdQeye9k5Am76muc6DQsG3PQ0TP8wAadP9D+ggALGDcTxLVDAuIE4vgUKGDcQx7dAAeMG4vgWKGDcQBzfAgWMG4jjW6CAcQNxfAsUMG4gjm+BAsYNxPEtUMC4gTi+BQoYNxDHt0AB4wbi+BYoYNxAHN8CBYwbiONboIBxA3F8CxQwbiCOb4ECxg3E8S1QwLiBOL4FChg3EMe3QAHjBuL4Fihg3EAc3wIFjBuI41tgPOAHo8I30I61Bo0AAAAASUVORK5CYII=',
							],
							likes: 24,
							dislikes: 0,
							date: '13 мая 2023',
							complexity: 'easy',
						}}
					/>
					{/* ))} */}
				</section>
			</section>
		</main>
	);
};
