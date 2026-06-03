import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { MenuHeaderLibService } from '../../menu-header-lib.service';
import { menuHeaderActions } from '../actions/menu-header.actions';

@Injectable()
export class MenuHeaderEffects {
	constructor(private actions$: Actions, private menuService: MenuHeaderLibService) {}

	// change password
	// changePassword$ = createEffect(() => {
	// 	return this.actions$.pipe(
	// 		ofType(menuHeaderActions.changePassword),
	// 		switchMap(({ Password }) => {
	// 			return this.menuService.changePassword(Password).pipe(
	// 				map((values: any) => {
	// 					if (values.type === 'SUCCESS') {
	// 						this.menuService.ref.close();
	// 						return menuHeaderActions.changePasswordSuccess({
	// 							passwordResponseValues: values.responseData.data[0],
	// 							error: values,
	// 						});
	// 					}
	// 					// else if (Grn.type === 'VALIDATION') {
	// 					// 	return menuHeaderActions.createGrnValidation({
	// 					// 		validationError: Grn,
	// 					// 	});
	// 					// }
	// 					else {
	// 						return menuHeaderActions.changePasswordFailure({
	// 							error: values,
	// 						});
	// 					}
	// 				}),
	// 				catchError((error: any) => {
	// 					if (error.error.type === 'ERROR') {
	// 						const errors = this.sendCatchError(error.statusText);
	// 						return of(menuHeaderActions.changePasswordFailure({ error: errors }));
	// 					}
	// 					return of();
	// 				})
	// 			);
	// 		})
	// 	);
	// });

	// redirectAfterUpdate$ = createEffect(
	// 	() =>
	// 		this.actions$.pipe(
	// 			ofType(grnActions.updateGrnSuccess),
	// 			tap((res: any) => {
	// 				if (res?.GrnUpdatedId.GRNHashedID_grn_Text) {
	// 					let grnId = res?.GrnUpdatedId.GRNHashedID_grn_Text;
	// 					this.grnService.handleUpdateSuccess(grnId);
	// 				}
	// 			})
	// 		),
	// 	{
	// 		dispatch: false,
	// 	}
	// );

	sendCatchError(message: string) {
		const errors = {
			type: 'ERROR',
			responseData: {
				data: [],
				message: [
					{
						key: message,
					},
				],
			},
		};
		return errors;
	}
}
