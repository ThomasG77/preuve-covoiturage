import { Given } from 'cypress-cucumber-preprocessor/steps';
import '../../support/parameters/userType';

Given('je suis connecté.e comme {userType}', function (userCredentials) {
  const { login, password } = userCredentials;
  cy.login(login, password);
});
