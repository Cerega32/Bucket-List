import {FC, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {EditGoalList} from '@/components/EditGoalList/EditGoalList';
import {Loader} from '@/components/Loader/Loader';
import {NotificationStore} from '@/store/NotificationStore';
import {ThemeStore} from '@/store/ThemeStore';
import {IList} from '@/typings/list';
import {IPage} from '@/typings/page';
import {getList} from '@/utils/api/get/getList';

export const PageEditGoalList: FC<IPage> = ({page}) => {
	const [isLoading, setIsLoading] = useState(true);
	const [listData, setListData] = useState<IList>({} as IList);
	const {setFull, setHeader, setPage} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
	}, []);

	const navigate = useNavigate();
	const {id} = useParams<{id: string}>();

	useEffect(() => {
		const loadData = async () => {
			if (!id) {
				navigate('/');
				return;
			}

			try {
				setIsLoading(true);

				// Загружаем данные списка
				const response = await getList(`goal-lists/${id}`);
				if (!response.success) {
					throw new Error(response.error || 'Невозможно загрузить список');
				}

				if (!response.data.list.isCanEdit) {
					NotificationStore.addNotification({
						type: 'error',
						title: 'Ошибка',
						message: 'Вы не можете редактировать этот список',
					});
					navigate(`/list/${id}`);
					return;
				}

				setListData(response.data.list);
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: error instanceof Error ? error.message : 'Произошла ошибка при загрузке данных',
				});
				navigate('/');
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [id]);

	if (isLoading) {
		return <Loader isLoading={isLoading} />;
	}

	return <EditGoalList listData={listData} canEditAll={listData?.isCanEdit} />;
};
