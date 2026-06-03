import { Injectable } from '@angular/core';
import { Country, State, City } from 'country-state-city';


@Injectable({
  providedIn: 'root'
})
export class SharedUiService {

  constructor() { }

  async get_countries() {
    return Country.getAllCountries().map((c: any) => ({ ...c, iso2: c.isoCode, emoji: c.flag }));
  }

  async get_states(country_iso: string) {
    return State.getStatesOfCountry(country_iso).map((s: any) => ({ ...s, iso2: s.isoCode }));
  }

  // get all district from an API
  async get_districts(country_iso: string, state_iso: string) {
    return City.getCitiesOfState(country_iso, state_iso);
  }

}
