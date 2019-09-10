import { Component, OnInit } from '@angular/core';

import { MenuTabInterface } from '~/core/interfaces/admin/adminLayoutInterface';
import { AuthenticationService } from '~/core/services/authentication/authentication.service';

@Component({
  selector: 'app-administration-layout',
  templateUrl: './administration-layout.component.html',
  styleUrls: ['./administration-layout.component.scss'],
})
export class AdministrationLayoutComponent implements OnInit {
  public menu: MenuTabInterface[] = [
    {
      path: '/admin/profile',
      label: 'Votre profil',
    },
    {
      path: '/admin/territory',
      groups: ['territory'],
      label: 'Territoire',
    },
    {
      path: '/admin/operator',
      groups: ['operator'],
      label: 'Opérateur',
    },
    // {
    //   path: '/admin/users',
    //   groups: ['operator', 'territory'],
    //   role: 'admin',
    //   label: 'Utilisateurs & accès',
    // },
    {
      path: '/admin/all-users',
      groups: ['registry'],
      role: 'admin',
      label: 'Utilisateurs & accès',
    },
    {
      path: '/admin/api',
      role: 'admin',
      groups: ['operator'],
      label: 'API',
    },
  ];

  constructor(public authenticationService: AuthenticationService) {}

  ngOnInit() {}
}
