import {FC} from 'react';
import {IPage} from '@/typings/page';
import {Categories} from '@/containers/Categories/categories';

export const PageCategories: FC<IPage> = (props) => {
	return <Categories page={props.page} />;
};
