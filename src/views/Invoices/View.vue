<script setup>
import axios from "axios";
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, watchEffect } from "vue";
import { useToast } from "vue-toast-notification";
import { useRouter } from "vue-router";
import { computed } from "@vue/reactivity";

const loading = ref(false);
const toast = useToast();
const router = useRouter();

const userStore = useUserStore();
const status = ref(userStore.status);

const invoice = {
	company: {
		name: "SA Appliance Repairs (PTY) LTD",
		email: "info@saappliancerepair.co.za",
		slogan: "Household and Commercial Appliance Repairs",
		address1: "24 Andries Pretorious Street",
		address2: "Glenlily",
		city: "Cape Town",
		state: 'Western Cape',
		country: 'South Africa',
		postal_code: 7500,
    currency_symbol: "R"
	},
	customer: {
		name: 'Ashiqah Lakay',
		address: '6 Plantation Centre Plantation Road',
		phone: '27217971488',
		vat: '45745843',
	},
	banking: {
		account_name: "SA Appliance Repairs (PTY) LTD",
		bank: "FNB",
		account_number: "62841711410",
		account_type: "Current",
		branch_code: "250655"
	},
	items: [
		{
			item: '24 Andries Pretorious Street, Glenlily, Cape Town. 7500',
			description: 'Toner Cartridge',
			quantity: 2,
			amount: 6000,
		},
		{
			item: 'USB_EXT',
			description: 'USB Cable Extender',
			quantity: 1,
			amount: 2000,
		},
		{
			item: '24 Andries Pretorious Street, Glenlily, Cape Town. 7500',
			description: 'Toner Cartridge',
			quantity: 2,
			amount: 6000,
		},
		{
			item: 'USB_EXT',
			description: 'USB Cable Extender',
			quantity: 1,
			amount: 2000,
		},
		{
			item: '24 Andries Pretorious Street, Glenlily, Cape Town. 7500',
			description: 'Toner Cartridge',
			quantity: 2,
			amount: 6000,
		},
	
	],
	subtotal: 8000,
	paid: 0,
  status: "Pending",
	name: "Invoice",
	invoice_nr: 1234,
	invoice_date: "26/10/2022",
	invoice_due_date: "27/10/2022",  
};

</script>

<template>
  <Header title="View invoice" />
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <main class="detail">
        <div class="status-container">
          <p class="status-title">Status</p>
          <p
            class="status-body"
            :class="[
              invoice.status === 'Draft'
                ? 'draft'
                : invoice.status === 'Pending'
                ? 'pending'
                : 'paid',
            ]"
          >
            <span class="status-circle">.</span> {{ invoice.status }}
          </p>
          <div class="btn-container">
            <button
              class="btn btn-edit"
              v-if="invoice.status === 'Draft' || invoice.status === 'Pending'"
              @click="editInvoice"
            >
              Edit
            </button>
            <button
              class="btn btn-mark"
              v-if="invoice.status === 'Pending'"
              @click="markAsPaid"
            >
              Mark as Paid
            </button>
          </div>
        </div>

        
        <div class="pl-5 pr-10">
          <!-- Invoice Header -->
          <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">
            <div class="flex items-center">
              <img src="@/assets/images/Logo Only.png" class="w-24 pr-2" loading="lazy" height="" width="" alt="Invoice Logo">
              <div>
                <h3 class="text-3xl">{{ invoice.company.name }}</h3> 
                <h3 class="text-xl">{{ invoice.company.slogan }}</h3> 
              </div>
            </div> 
            <div class="text-right">
              <div class="text-lg">{{invoice.company.name}}</div>
              <div class="text-lg">{{invoice.company.address1}}</div>
              <div class="text-lg">{{invoice.company.address2 + " " + invoice.company.city}}</div>
              <div class="text-lg">{{invoice.company.state + ", " + invoice.company.country}}</div>
              <div class="text-lg">{{invoice.company.postal_code}}</div>
              <div class="text-lg">Email: {{invoice.company.email}}</div>
            </div>
          </div>

          <!-- Invoice Sub-Header -->
          <div>
            <div class="text-5xl mt-10">{{invoice.name}}</div>
            <div class="border-4 border-b-[#11101e] mt-1 mb-5"></div>
          </div>

          <!-- Invoice Details and Banking Details -->
          <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">

            <!-- Invoice Details -->
            <div>
              <div class="text-2xl font-bold">{{invoice.name}} Details</div>
              <div class="text-lg">{{invoice.name}} #: {{invoice.invoice_nr}}</div>
              <div class="text-lg">{{invoice.name}} Date: {{invoice.invoice_date}}</div>
              <div class="text-lg">{{invoice.name}} Due: {{invoice.invoice_due_date}}</div>
              <div class="text-lg font-bold">Balance Due: {{invoice.company.currency_symbol + (invoice.subtotal - invoice.paid)}}</div>
            </div>

            <!-- Banking Details -->
            <div>
              <div class="text-2xl font-bold">Banking Details</div>
              <div class="text-lg">Name: {{invoice.banking.account_name}}</div>
              <div class="text-lg">Bank Name: {{invoice.banking.bank}}</div>
              <div class="text-lg">Account #: {{invoice.banking.account_number}}</div>
              <div class="text-lg">Account Type: {{invoice.banking.account_type}}</div>
              <div class="text-lg">Branch Code: {{invoice.banking.branch_code}}</div>
            </div>
          </div>

          <div class="border-4 border-b-[#11101e] mt-5 mb-5"></div>

          <!-- Billed To -->
          <div class="">
            <div class="text-2xl font-bold">Billed To</div>
            <div class="text-lg">Name: {{invoice.customer.name}}</div>
            <div class="text-lg">Address: {{invoice.customer.address}}</div>
            <div class="text-lg">Phone #: {{invoice.customer.phone}}</div>
            <div class="text-lg">VAT: {{invoice.customer.vat}}</div>
          </div>

          <div class="border-4 border-b-[#11101e] mt-5 mb-20"></div>

          <!-- Line Items Heading -->
          <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
            <div class="text-lg font-bold col-span-9">Item</div>
            <div class="text-lg font-bold text-center">Unit Cost</div>
            <div class="text-lg font-bold text-center">Quantity</div>
            <div class="text-lg font-bold text-right">Total</div>
          </div>

          <!-- Line Items -->
          <div v-for="item in invoice.items" class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
            <div class="text-md col-span-9 pb-2">
              {{item.item}}
              <p class="text-sm">{{item.description}}</p>
            </div>
            <div class="text-md text-center content-center">{{invoice.company.currency_symbol + item.amount}}</div>
            <div class="text-md text-center content-center">{{item.quantity}}</div>
            <div class="text-md text-right content-center">{{invoice.company.currency_symbol + (Number(item.amount) * Number(item.quantity))}}</div>            
          </div>
          
          <!-- Sub Totals -->
          <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 mt-10">
            <div class="text-md font-bold col-span-9"></div>
            <div class="text-md text-left">Subtotal</div>
            <div class="text-md font-bold text-center"></div>
            <div class="text-md text-right">{{invoice.company.currency_symbol + invoice.subtotal}}</div>
          </div>

          <!-- Paid To Date -->
          <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2">
            <div class="text-md font-bold col-span-9"></div>
            <div class="text-md text-left">Paid To Date</div>
            <div class="text-md font-bold text-center"></div>
            <div class="text-md text-right">{{invoice.company.currency_symbol + invoice.paid}}</div>
          </div>

          <!-- Balance Due  -->
          <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2">
            <div class="text-md font-bold col-span-9"></div>
            <div class="text-md font-bold text-left">Balance Due</div>
            <div class="text-md font-bold text-center"></div>
            <div class="text-md font-bold text-right">{{invoice.company.currency_symbol + (invoice.subtotal - invoice.paid)}}</div>
          </div>

          <div class="mt-20 mb-20 text-center">Payment is due within 1 day. Thank you for your business.</div>

        </div>
        
      </main>
    </div>
  </div>
</template>


<style scoped>
  .detail {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 7px solid #11101e;
  }
  .link {
    text-decoration: none;
  }
  .back-icon {
    width: 10px;
    height: 10px;
  }
  .back-text {
    color: white;
    font-weight: 700;
    margin-left: 20px;
  }
  .status-container {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background-color: #11101e;
    margin: 5px;
    color: #fff;
  }
  .status-title {
    font-weight: 600;
    flex-basis: 60px;
  }
  .status-body {
    width: 105px;
    padding: 13px 0 13px 30px;
    border-radius: 6px;
    font-weight: 700;
    display: flex;
    align-items: center;
    position: relative;
  }
  .status-circle {
    font-size: 40px;
    position: absolute;
    left: 15px;
    top: -14px;
    line-height: 1.25;
  }
  .draft {
    background-color: #292c45;
    color: rgb(224, 228, 251);
  }
  .pending {
    background-color: rgba(255, 145, 0, 0.06);
    color: rgb(255, 145, 0);
  }
  .paid {
    background-color: rgba(51, 215, 160, 0.06);
    color: rgb(51, 215, 160);
  }
  .btn-container {
    margin-left: auto;
  }
  .btn {
    padding: 16px 24px;
    border: none;
    border-radius: 24px;
    color: white;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-edit {
    background-color: #252946;
    margin-left: auto;
  }
  .btn-edit:hover {
    background-color: #1b1d32;
  }
  .btn-delete {
    background-color: #ec5555;
    margin-left: 10px;
  }
  .btn-delete:hover {
    background-color: #fb999a;
  }
  .btn-mark {
    background-color: #7b5cfa;
    margin-left: 10px;
  }
  .btn-mark:hover {
    background-color: #9175ff;
  }
  .details {
    padding: 20px 30px;
    display: grid;
    background-color: #1e2238;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    border-radius: 8px;
  }
  .project-info {
    grid-column-start: 1;
    grid-column-end: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .project-id {
    font-size: 16px;
    font-weight: 700;
  }
  .date-body,
  .due-body,
  .name-body,
  .mail-body {
    font-size: 15px;
    font-weight: 700;
  }
  .adress {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    grid-column-start: 3;
    grid-column-end: 4;
  }
  .date {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 1;
    grid-column-end: 2;
    gap: 10px;
  }
  .name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 2;
    grid-column-end: 3;
    gap: 10px;
  }
  .mail {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 3;
    grid-column-end: 4;
    gap: 10px;
  }
  .due {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    grid-column-start: 1;
    grid-column-end: 2;
    gap: 10px;
  }
  .client-adress {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 2;
    grid-column-end: 3;
  }
  .item-container {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 4;
    grid-row-end: 5;
    padding: 20px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background-color: #252946;
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
    row-gap: 20px;
  }
  .project-item {
    grid-column-start: 1;
    grid-column-end: 5;
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
  }
  .prj-text {
    font-weight: 700;
  }
  .amount {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 5;
    grid-row-end: 6;
    padding: 20px 70px 20px 20px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    background-color: #0d0e17;
    margin-top: -20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .amount-number {
    font-size: 20px;
    font-weight: 700;
  }

  @media screen and (max-width: 1024px) {
    .detail {
      padding: 100px 120px 20px 120px;
    }
  }

  @media screen and (max-width: 750px) {
    .detail {
      padding: 100px 20px 20px 20px;
    }
  }
</style>
