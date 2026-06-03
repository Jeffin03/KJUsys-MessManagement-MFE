import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { HeaderInterface } from '../menu-header.reducer';

export const menuHeaderActions = createActionGroup({
	source: 'menuHeader',
	events: {
		'Change Password': props<{ Password: HeaderInterface }>(),
		'Change Password Success': props<{
			passwordResponseValues: any;
			error: any;
		}>(),
		'Change Password Failure': props<{ error: any }>(),
		'Change Password Closed': emptyProps(),
	},
});
