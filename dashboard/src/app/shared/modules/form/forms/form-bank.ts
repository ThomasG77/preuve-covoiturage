import { FormControl, Validators } from '@angular/forms';

import { Bank } from '~/core/entities/shared/bank';
import { REGEXP } from '~/core/const/validators.const';

export class FormBank {
  bank_name = new FormControl(); // tslint:disable-line variable-name
  client_name = new FormControl(); // tslint:disable-line variable-name
  iban = new FormControl();
  bic = new FormControl();

  constructor(bank: Bank) {
    this.bank_name.setValue(bank.bank_name);

    this.client_name.setValue(bank.client_name);

    this.iban.setValue(bank.iban);
    this.iban.setValidators([Validators.pattern(REGEXP.iban)]);

    this.bic.setValue(bank.bic);
    this.bic.setValidators([Validators.pattern(REGEXP.bic)]);
  }
}
