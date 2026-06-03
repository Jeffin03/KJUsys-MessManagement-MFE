import { createFeature, createReducer, on } from '@ngrx/store';
import { menuHeaderActions } from './actions/menu-header.actions';

export interface HeaderInterface {
	password_user_Text: string;
	currentPassword_user_Text: string;
}
export interface ResponseInterFace {
	type: string;
	data: any;
	responseData: any;
}

export interface HeaderInterfaceState {
	passwordValues: HeaderInterface[];
	isSaving: boolean,
	error: any;
}

const initialState: HeaderInterfaceState = {
	passwordValues: [],
	isSaving: false,
	error: null,
};

const menuHeaderFeature = createFeature({
	name: 'menuHeader',
	reducer: createReducer(
		initialState,

		//change Password
		on(menuHeaderActions.changePassword, (state, action) => ({
			...state,
			isSaving: true,
		})),

		on(menuHeaderActions.changePasswordSuccess, (state, action) => ({
			...state,
			isSaving: false,
			passwordValues: action.passwordResponseValues,
			error: action.error,
		})),

		on(menuHeaderActions.changePasswordFailure, (state, action) => ({
			...state,
			error: action.error,
			isSaving: false,
		}))
		,
		on(menuHeaderActions.changePasswordClosed, (state) => ({
			...state,
			isSaving: false,
			error: null,
		}))
	),
});

export const {
	name: menuHeaderFeatureKey,
	reducer: menuHeaderReducer,
	selectError,
	selectPasswordValues,
} = menuHeaderFeature;
