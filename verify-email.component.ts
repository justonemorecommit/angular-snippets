import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";

import { AuthService } from "src/app/services/auth.service";
import { GlobalService } from "src/app/services/global-services.service";
import { ToastService } from "src/app/services/toast.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-verify-email",
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./verify-email.component.scss"],
})
export class VerifyEmailComponent implements OnInit {
  token!: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private globalService: GlobalService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.logout();
    this.globalService.setLoggedOn(false);

    this.activatedRoute.params.subscribe((params: Params) => {
      this.token = params.token;
    });
  }

  verifyEmail() {
    this.userService
      .verifyEmail(this.token)

      .subscribe(
        (res) => {
          if (res && res.success) {
            ToastService.success("Verify email successfully!");
            this.authService.setSession(res.result);
            this.globalService.setLoggedOn(true);
            this.router.navigate(["home"]);
          } else {
            ToastService.error("Verify email Failed!");
          }
        },
        () => {
          ToastService.error("Verify email Failed!");
        }
      );
  }
}
