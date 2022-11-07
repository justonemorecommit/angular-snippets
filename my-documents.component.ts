import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ProgressSpinnerConfig } from "src/app/common/progress-spinner-config";
import { PAYMENT_AMOUNT } from "src/app/const/documents.constants";
import { CreateDocument } from "src/app/dto/CreateDocument.dto";
import { CreatePaymentIntent } from "src/app/dto/CreatePaymentIntent.dto";
import { PaymentIntent } from "src/app/dto/PaymentIntent.dto";
import { PaymentMethod } from "src/app/dto/PaymentMethod.dto";
import { DocumentStatus } from "src/app/enums/document-status.enum";
import { PaymentType } from "src/app/enums/payment-type.enum";
import { DocumentService } from "src/app/services/document.service";
import { StripeService } from "src/app/services/stripe.service";
import { ToastService } from "src/app/services/toast.service";
import { Document } from "src/app/entities/document.entity";

@Component({
  selector: "app-my-documents",
  templateUrl: "./my-documents.component.html",
  styleUrls: ["./my-documents.component.scss"],
})
export class MyDocumentsComponent implements OnInit {
  @ViewChild("paymentModal") paymentModal!: ElementRef;
  @ViewChild("createDocumentModal") createDocumentModal!: ElementRef;
  @ViewChild("paymentMethodModal") paymentMethodModal!: ElementRef;

  progressSpinnerConfig: ProgressSpinnerConfig = {
    color: "primary",
    mode: "determinate",
    strokeWidth: 8,
  };
  documentStatus = DocumentStatus;
  activeDocuments: Document[] = [];
  expiredDocuments: Document[] = [];
  awaitingPaymentConfirmationDocuments: Document[] = [];

  paymentAmount = PAYMENT_AMOUNT;
  formDataCreateDocument!: FormGroup;
  paymentMethods!: PaymentMethod[];
  //formDataPaymentMethod!: FormGroup;
  createPaymentIntent!: CreatePaymentIntent;
  isSwitch!: boolean;
  paymentIntent!: PaymentIntent;
  currentDocumentName!: string;

  constructor(
    private formBuilder: FormBuilder,
    private documentService: DocumentService,
    private stripeService: StripeService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.formDataCreateDocument = this.formBuilder.group({
      name: ["", Validators.required],
      description: "",
    });
    this.paymentMethods = [];
    // this.formDataPaymentMethod = this.formBuilder.group({
    //     paymentMethodId: ['', Validators.required],
    // });
    this.createPaymentIntent = {
      documentId: 0,
      currency: "usd",
      paymentMethodId: "",
      paymentType: PaymentType.new,
    };
    this.isSwitch = false;
    this.paymentIntent = {
      clientSecret: "",
      paymentIntentId: "",
    };
    this.listPaymentMethod();
    this.getList();
  }

  handleCreateDocument = (): void => {
    if (this.formDataCreateDocument.valid) {
      this.documentService
        .create(this.formDataCreateDocument.value as CreateDocument)
        .subscribe(
          (res) => {
            if (res && res.success) {
              this.createPaymentIntent = {
                ...this.createPaymentIntent,
                documentId: res.result,
              };
              this.closeModal();
              this.currentDocumentName = this.formDataCreateDocument.value.name;
              this.formDataCreateDocument.reset();
              this.handleCreatePaymentIntent();
              this.getList();
            }
          },
          () => {
            ToastService.error("Create Failed!");
          }
        );
    }
  };

  listPaymentMethod = (): void => {
    this.stripeService.listPaymentMethod().subscribe(
      (res) => {
        if (res && res.success) {
          this.paymentMethods = res.result;
        }
      },
      () => {
        console.log("Get list payment method failed!");
      }
    );
  };

  cancelPaymentIntent = (): void => {
    if (this.paymentIntent.paymentIntentId) {
      this.stripeService
        .cancelPaymentIntent(this.paymentIntent.paymentIntentId)
        .subscribe(
          (res) => {
            if (res && res.success) {
              this.paymentIntent = {
                clientSecret: "",
                paymentIntentId: "",
              };
            }
          },
          () => {
            console.log("Cancel payment intent failed!");
          }
        );
    }
  };

  handleSwitchCardPayment = (): void => {
    this.isSwitch = true;
    //this.formDataPaymentMethod.reset();
    this.closeModal();
    this.createPaymentIntent = {
      ...this.createPaymentIntent,
      paymentMethodId: "",
    };

    this.handleCreatePaymentIntent();
  };

  handlePaymentWithPaymentMethod = (): void => {
    if (this.paymentMethods.length) {
      this.stripeService
        .paymentWithPaymentMethod({
          ...this.createPaymentIntent,
          paymentMethodId: this.paymentMethods[0].paymentMethodId,
        })
        .subscribe(
          (res) => {
            if (res && res.success) {
              this.closeModal();
              //this.formDataPaymentMethod.reset();
              this.getList();
              ToastService.success("Payment success!");
            }
          },
          () => {
            ToastService.error("Create Failed!");
          }
        );
    }
  };

  closePaymentModal = (): void => {
    this.paymentIntent = {
      clientSecret: "",
      paymentIntentId: "",
    };
    this.listPaymentMethod();
    this.getList();
    this.closeModal();
  };

  getList = (): void => {
    this.documentService.getList().subscribe(
      (res) => {
        if (res && res.success) {
          res.result = res.result.map((d) => {
            d.createdAt = new Date(d.createdAt);
            d.updatedAt = new Date(d.updatedAt);
            d.expireDate = d.expireDate ? new Date(d.expireDate) : null;
            return d;
          });

          this.awaitingPaymentConfirmationDocuments = res.result.filter(
            (d) => d.status === DocumentStatus.awaitingPaymentConfirmation
          );

          this.activeDocuments = res.result.filter(
            (d) =>
              d.status === DocumentStatus.inProgress ||
              d.status === DocumentStatus.completed
          );

          this.expiredDocuments = res.result.filter(
            (d) => d.status === DocumentStatus.expired
          );
        }
      },
      () => {
        console.log("Get list document failed!");
      }
    );
  };

  openCreateDocumentModal = (): void => {
    this.modalService
      .open(this.createDocumentModal, {
        modalDialogClass: "create_document_modal",
      })
      .result.then(
        (result: any) => {},
        (reason: any) => {}
      );
  };

  extentPayment = (document: Document): void => {
    this.createPaymentIntent = {
      ...this.createPaymentIntent,
      documentId: document.id,
      paymentType: PaymentType.extend,
    };
    this.currentDocumentName = document.name;
    this.handleCreatePaymentIntent();
  };

  closePaymentMethodModal = (): void => {
    this.getList();
    this.closeModal();
  };

  private closeModal = (): void => {
    this.modalService.dismissAll();
  };

  private openPaymentModal = (): void => {
    this.modalService
      .open(this.paymentModal, {
        modalDialogClass: "payment_modal",
      })
      .result.then(
        (result: any) => {},
        (reason: any) => {
          this.cancelPaymentIntent();
        }
      );
  };

  private openPaymentMethodModal = (): void => {
    this.modalService.open(this.paymentMethodModal, {
      modalDialogClass: "payment_method_modal",
    });
  };

  private handleCreatePaymentIntent = (): void => {
    if (!this.isSwitch && this.paymentMethods.length) {
      this.openPaymentMethodModal();
      return;
    }

    this.stripeService.createPaymentIntent(this.createPaymentIntent).subscribe(
      (res) => {
        if (res && res.success) {
          this.paymentIntent = res.result;
          this.isSwitch = false;
          this.openPaymentModal();
        }
      },
      () => {
        console.log("Create payment intent failed!");
      }
    );
  };
}
