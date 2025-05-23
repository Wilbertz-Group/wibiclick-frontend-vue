<template>
  <!-- Main container with sophisticated background -->
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 text-gray-800 dark:text-gray-200 font-sans transition-all duration-300">
    
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

      <!-- Enhanced Header Section -->
      <header class="mb-8 md:mb-12">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <!-- Title with breadcrumb -->
          <div>
            <nav class="text-sm breadcrumbs mb-2">
              <ol class="list-none p-0 inline-flex text-gray-500 dark:text-gray-400">
                <li class="flex items-center">
                  <font-awesome-icon icon="home" class="mr-2" />
                  <span>Dashboard</span>
                  <font-awesome-icon icon="chevron-right" class="mx-2 text-xs" />
                </li>
                <li class="text-indigo-600 dark:text-indigo-400 font-medium">Jobs</li>
              </ol>
            </nav>
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <font-awesome-icon icon="briefcase" class="text-indigo-600 dark:text-indigo-400" />
              </div>
              Manage Jobs
              <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                {{ totalJobs }}{{ activeFiltersCount > 0 ? ` of ${jobs.length}` : '' }} total
              </span>
            </h1>
          </div>
          
          <!-- Enhanced Action buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Website Selector -->
            <Listbox v-model="selectedWebsite" as="div" class="relative w-full sm:w-72">
              <ListboxButton class="input-modern input-modern--select pl-3 pr-8 text-sm w-full flex items-center justify-between">
                <span class="block truncate">
                  {{ opt.find(a => a.value === selectedWebsite)?.label || 'Select Website' }}
                </span>
              </ListboxButton>
              <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <ListboxOptions class="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <ListboxOption v-for="website in opt" :key="website.value" :value="website.value" v-slot="{ active, selected }">
                    <li :class="[active ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100', 'relative cursor-default select-none py-2 pl-10 pr-4']">
                      <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ website.label }}</span>
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </Listbox>
            
            <!-- Quick Actions -->
            <div class="flex items-center gap-2">
              <button v-if="isDesktop" @click="toggleView" class="btn-icon-modern" :title="viewMode === 'table' ? 'Switch to Cards' : 'Switch to Table'">
                <font-awesome-icon :icon="viewMode === 'table' ? 'th-large' : 'table'" />
              </button>
              <button @click="exportJobs" class="btn-icon-modern" title="Export Jobs">
                <font-awesome-icon icon="download" />
              </button>
              <button @click="reloadJobs" class="btn-icon-modern" title="Reload Jobs">
                <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
              </button>
              <button @click="openJobFormModal" class="btn-primary-modern">
                <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> 
                <span>Add Job</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card-modern">
            <div class="flex items-center">
              <div class="stat-icon-modern bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <font-awesome-icon icon="briefcase" />
              </div>
              <div class="ml-3">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  Total Jobs
                  <span v-if="activeFiltersCount > 0" class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    Filtered
                  </span>
                </p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ totalJobs || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="stat-card-modern">
            <div class="flex items-center">
              <div class="stat-icon-modern bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                <font-awesome-icon icon="check-circle" />
              </div>
              <div class="ml-3">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ completedJobs || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="stat-card-modern">
            <div class="flex items-center">
              <div class="stat-icon-modern bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400">
                <font-awesome-icon icon="clock" />
              </div>
              <div class="ml-3">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pending</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ pendingJobs || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="stat-card-modern">
            <div class="flex items-center">
              <div class="stat-icon-modern bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                <font-awesome-icon icon="dollar-sign" />
              </div>
              <div class="ml-3">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Revenue</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalRevenue) }}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

        <!-- Filter Info Banner -->
        <div v-if="filteringSummary" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <font-awesome-icon icon="info-circle" class="text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Showing {{ filteringSummary.filteredJobs }} of {{ filteringSummary.totalJobs }} jobs
                <span v-if="filteringSummary.hiddenJobs > 0" class="text-blue-600 dark:text-blue-300">
                  ({{ filteringSummary.hiddenJobs }} hidden by filters)
                </span>
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Metrics above reflect filtered results only
              </p>
            </div>
            <button @click="clearFilters" class="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
              <font-awesome-icon icon="times" class="w-4 h-4" />
            </button>
          </div>
        </div>
      <section class="mb-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <font-awesome-icon icon="filter" class="text-indigo-600 dark:text-indigo-400" />
            Filters & Search
          </h3>
          <div class="flex items-center gap-2">
            <button @click="showAdvancedFilters = !showAdvancedFilters" class="btn-secondary-modern text-sm">
              {{ showAdvancedFilters ? 'Basic' : 'Advanced' }}
              <font-awesome-icon :icon="showAdvancedFilters ? 'minus' : 'plus'" class="ml-1" />
            </button>
            <button @click="clearFilters" class="btn-secondary-modern text-sm">
              <font-awesome-icon icon="times" class="mr-1" />
              Clear
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
          <!-- Search Input -->
          <div class="relative">
            <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="filters.search" placeholder="Search customer or issue..." class="input-modern pl-10 pr-3" />
          </div>
          
          <!-- Status Filter -->
          <select v-model="filters.status" class="input-modern input-modern--select">
            <option value="">All Statuses</option>
            <option v-for="status in JOB_STATUSES" :key="status" :value="status">{{ status }}</option>
          </select>
          
          <!-- Technician Filter -->
          <select v-model="filters.technician" class="input-modern input-modern--select">
            <option value="">All Technicians</option>
            <option v-for="tech in technicians" :key="tech.id" :value="tech.id">{{ tech.firstName }} {{ tech.lastName }}</option>
          </select>

          <!-- Date Range Quick Select -->
          <select v-model="filters.dateRange" @change="applyDateRange" class="input-modern input-modern--select">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this_week">This Week</option>
            <option value="next_week">Next Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          <!-- Advanced Filters (conditionally rendered) -->
          <template v-if="showAdvancedFilters">
            <div class="relative">
              <font-awesome-icon icon="map-marker-alt" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input v-model="filters.location" placeholder="Location" class="input-modern pl-10 pr-3" />
            </div>
            
            <input :value="formatDateForInput(filters.startDate)" @input="updateStartDateFilter" type="date" class="input-modern" />
            <input :value="formatDateForInput(filters.endDate)" @input="updateEndDateFilter" type="date" class="input-modern" />
            
            <!-- Revenue Range -->
            <div class="flex gap-2">
              <input v-model="filters.minRevenue" placeholder="Min Revenue" type="number" class="input-modern flex-1" />
              <input v-model="filters.maxRevenue" placeholder="Max Revenue" type="number" class="input-modern flex-1" />
            </div>
          </template>
        </div>

        <!-- Active Filters Display -->
        <div v-if="activeFiltersCount > 0" class="mt-4 flex flex-wrap gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          <span v-for="filter in activeFilters" :key="filter.key" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
            {{ filter.label }}
            <button @click="removeFilter(filter.key)" class="ml-1 hover:text-indigo-600">
              <font-awesome-icon icon="times" class="w-3 h-3" />
            </button>
          </span>
        </div>
      </section>

      <!-- Bulk Actions (when jobs are selected) -->
      <section v-if="selectedJobs.length > 0" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
            {{ selectedJobs.length }} job{{ selectedJobs.length !== 1 ? 's' : '' }} selected
          </span>
          <div class="flex flex-wrap gap-2">
            <button @click="bulkUpdateStatus" class="btn-secondary-modern text-sm">
              <font-awesome-icon icon="edit" class="mr-1" />
              Update Status
            </button>
            <button @click="bulkAssignTechnician" class="btn-secondary-modern text-sm">
              <font-awesome-icon icon="user-plus" class="mr-1" />
              Assign Technician
            </button>
            <button @click="bulkExport" class="btn-secondary-modern text-sm">
              <font-awesome-icon icon="download" class="mr-1" />
              Export Selected
            </button>
            <button @click="clearSelection" class="btn-ghost-modern text-sm">
              Clear Selection
            </button>
          </div>
        </div>
      </section>

      <!-- Job List Section -->
      <section>
        <!-- View Toggle for Desktop -->
        <div class="hidden md:flex justify-between items-center mb-4">
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalJobs }} results
            </span>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Items per page:</label>
              <select v-model="itemsPerPage" @change="currentPage = 1" class="input-modern input-modern--select text-sm py-1">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
          </div>
          <div v-if="isDesktop" class="flex items-center gap-2">
            <button @click="viewMode = 'cards'" :class="viewMode === 'cards' ? 'btn-primary-modern' : 'btn-secondary-modern'" class="text-sm px-3 py-1">
              <font-awesome-icon icon="th-large" class="mr-1" />
              Cards
            </button>
            <button @click="viewMode = 'table'" :class="viewMode === 'table' ? 'btn-primary-modern' : 'btn-secondary-modern'" class="text-sm px-3 py-1">
              <font-awesome-icon icon="table" class="mr-1" />
              Table
            </button>
          </div>
        </div>

        <!-- Mobile Card View -->
        <div v-if="effectiveViewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Mobile Skeleton -->
          <div v-if="loading" v-for="n in 6" :key="`skel-card-${n}`" class="enhanced-card-modern animate-pulse">
            <div class="flex justify-between items-start mb-3">
              <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/5"></div>
              <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            </div>
            <div class="flex justify-between items-center">
              <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              <div class="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>

          <!-- Enhanced Job Cards -->
          <div v-if="!loading && paginatedJobs.length > 0" v-for="job in paginatedJobs" :key="job.id" class="enhanced-card-modern group">
            <!-- Selection Checkbox -->
            <div class="flex items-start gap-3 mb-4">
              <input 
                type="checkbox" 
                :value="job.id" 
                v-model="selectedJobs" 
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div class="flex-1">
                <div class="flex justify-between items-start mb-3">
                  <router-link :to="{ name: 'contact', query: { customer_id: job.customer?.id } }" 
                               class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline leading-tight group-hover:text-indigo-700 transition-colors">
                    {{ job.name }}
                  </router-link>
                  <span :class="getModernStatusClass(job.jobStatus)" class="status-badge-modern flex-shrink-0">
                    {{ job.jobStatus }}
                  </span>
                </div>

                <!-- Issue Description -->
                <div class="mb-3">
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    <span class="font-medium text-gray-800 dark:text-gray-200">Issue:</span>
                    {{ job.issue }}
                  </p>
                </div>

                <!-- Job Details Grid -->
                <div class="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div class="flex items-center">
                    <font-awesome-icon icon="calendar" class="mr-2 w-3 text-blue-500" />
                    <span>{{ formatDate(job.slotStart) }}</span>
                  </div>
                  <div class="flex items-center">
                    <font-awesome-icon icon="user" class="mr-2 w-3 text-green-500" />
                    <span>{{ job.employee?.firstName }} {{ job.employee?.lastName || 'Unassigned' }}</span>
                  </div>
                  <div class="flex items-center">
                    <font-awesome-icon icon="map-marker-alt" class="mr-2 w-3 text-red-500" />
                    <span>{{ job.location }}</span>
                  </div>
                  <div class="flex items-center">
                    <font-awesome-icon icon="phone" class="mr-2 w-3 text-purple-500" />
                    <span>{{ job.phone }}</span>
                  </div>
                </div>

                <!-- Financial Summary (if available) -->
                <div v-if="job.totalPayments || job.totalExpenses" class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <div class="grid grid-cols-3 gap-2 text-xs">
                    <div class="text-center">
                      <span class="block font-medium text-gray-600 dark:text-gray-400">Revenue</span>
                      <span class="text-green-600 dark:text-green-400 font-semibold">{{ formatCurrency(job.totalPayments || 0) }}</span>
                    </div>
                    <div class="text-center">
                      <span class="block font-medium text-gray-600 dark:text-gray-400">Expenses</span>
                      <span class="text-red-600 dark:text-red-400 font-semibold">{{ formatCurrency(job.totalExpenses || 0) }}</span>
                    </div>
                    <div class="text-center">
                      <span class="block font-medium text-gray-600 dark:text-gray-400">Profit</span>
                      <span :class="getProfitClass(job.netProfit || 0)" class="font-semibold">{{ formatCurrency(job.netProfit || 0) }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- No Financial Data Message -->
                <div v-else class="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p class="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                    No payments or expenses recorded
                  </p>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2">
                  <button @click="viewJobDetails(job.id)" class="btn-ghost-modern text-xs flex-1">
                    <font-awesome-icon icon="eye" class="mr-1" />
                    View
                  </button>
                  <button @click="editJob(job)" class="btn-ghost-modern text-xs flex-1">
                    <font-awesome-icon icon="edit" class="mr-1" />
                    Edit
                  </button>
                  <button @click="notifyTechnician(job)" class="btn-ghost-modern text-xs flex-1">
                    <font-awesome-icon icon="bell" class="mr-1" />
                    Notify
                  </button>
                  <button @click="showJobActions(job)" class="btn-ghost-modern text-xs">
                    <font-awesome-icon icon="ellipsis-h" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Desktop Table View -->
        <div v-if="effectiveViewMode === 'table'" class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <!-- Table Header with Sorting -->
          <div class="bg-gray-50/80 dark:bg-gray-900/50 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected" 
                  @change="toggleSelectAll"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Select All</span>
              </div>
              <div class="flex items-center gap-2">
                <button @click="refreshTable" class="btn-icon-modern text-xs">
                  <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop Skeleton -->
          <div v-if="loading" class="animate-pulse">
            <table class="min-w-full">
              <thead class="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th v-for="header in enhancedTableHeaders" :key="`skel-head-${header.key}`" class="th-modern">
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in 10" :key="`skel-row-${n}`" class="border-b border-gray-100 dark:border-gray-700/50">
                  <td v-for="header in enhancedTableHeaders" :key="`skel-cell-${header.key}`" class="td-modern">
                    <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded" :class="header.key === 'actions' ? 'w-20' : 'w-4/5'"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Enhanced Table -->
          <table v-if="!loading && paginatedJobs.length > 0" class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
            <thead class="bg-gray-50/50 dark:bg-gray-900/30">
              <tr>
                <th scope="col" class="th-modern w-12">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th v-for="header in enhancedTableHeaders" :key="header.key" scope="col" 
                    class="th-modern cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    @click="sortBy(header.key)">
                  <div class="flex items-center gap-2">
                    {{ header.label }}
                    <font-awesome-icon v-if="sortKey === header.key" 
                                       :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'" 
                                       class="text-indigo-600 dark:text-indigo-400" />
                    <font-awesome-icon v-else icon="sort" class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
              <tr v-for="job in paginatedJobs" :key="job.id" 
                  class="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-150 group"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/30': selectedJobs.includes(job.id) }">
                <td class="td-modern">
                  <input 
                    type="checkbox" 
                    :value="job.id" 
                    v-model="selectedJobs" 
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </td>
                <td class="td-modern">
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                      {{ job.name?.charAt(0)?.toUpperCase() || 'J' }}
                    </div>
                    <div>
                      <router-link :to="{ name: 'contact', query: { customer_id: job.customer?.id } }" 
                                   class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        {{ job.name }}
                      </router-link>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ job.customer?.phone }}</p>
                    </div>
                  </div>
                </td>
                <td class="td-modern">
                  <div class="max-w-xs">
                    <p class="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{{ job.issue }}</p>
                  </div>
                </td>
                <td class="td-modern">
                  <span :class="getModernStatusClass(job.jobStatus)" class="status-badge-modern">
                    {{ job.jobStatus }}
                  </span>
                </td>
                <td class="td-modern text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ formatDate(job.slotStart) }}</span>
                    <span class="text-xs">{{ formatTime(job.slotStart) }}</span>
                  </div>
                </td>
                <td class="td-modern">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {{ job.employee?.firstName?.charAt(0) || '?' }}
                    </div>
                    <span class="text-sm text-gray-900 dark:text-gray-100">
                      {{ job.employee?.firstName }} {{ job.employee?.lastName || 'Unassigned' }}
                    </span>
                  </div>
                </td>
                <td class="td-modern text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-1">
                    <font-awesome-icon icon="map-marker-alt" class="text-red-500 w-3" />
                    {{ job.location }}
                  </div>
                </td>
                <td class="td-modern">
                  <div v-if="job.totalPayments || job.totalExpenses" class="flex flex-col text-xs">
                    <span class="text-green-600 dark:text-green-400">+{{ formatCurrency(job.totalPayments || 0) }}</span>
                    <span class="text-red-600 dark:text-red-400">-{{ formatCurrency(job.totalExpenses || 0) }}</span>
                    <span :class="getProfitClass(job.netProfit || 0)" class="font-semibold">{{ formatCurrency(job.netProfit || 0) }}</span>
                  </div>
                  <div v-else class="flex flex-col text-xs">
                    <span class="text-gray-400 dark:text-gray-500 text-center">No data</span>
                  </div>
                </td>
                <td class="td-modern">
                  <div class="flex items-center gap-1">
                    <button @click="viewJobDetails(job.id)" class="btn-icon-modern text-xs" title="View Details">
                      <font-awesome-icon icon="eye" />
                    </button>
                    <button @click="editJob(job)" class="btn-icon-modern text-xs" title="Edit Job">
                      <font-awesome-icon icon="edit" />
                    </button>
                    <button @click="notifyTechnician(job)" class="btn-icon-modern text-xs" title="Notify Technician">
                      <font-awesome-icon icon="bell" />
                    </button>
                    <div class="relative">
                      <button @click="showJobActions(job)" class="btn-icon-modern text-xs" title="More Actions">
                        <font-awesome-icon icon="ellipsis-v" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Enhanced Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> 
              of <span class="font-medium">{{ totalJobs }}</span> results
            </span>
            <select v-model="itemsPerPage" @change="currentPage = 1" class="input-modern input-modern--select text-sm py-1 px-2">
              <option :value="10">10 per page</option>
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>
          
          <div class="flex items-center gap-1">
            <button @click="currentPage = 1" :disabled="currentPage === 1" class="btn-pagination-modern">
              <font-awesome-icon icon="angle-double-left" />
            </button>
            <button @click="prevPage" :disabled="currentPage === 1" class="btn-pagination-modern">
              <font-awesome-icon icon="angle-left" class="mr-1" /> Previous
            </button>
            
            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <button v-for="page in visiblePages" :key="page" @click="currentPage = page"
                      :class="page === currentPage ? 'btn-primary-modern' : 'btn-pagination-modern'"
                      class="px-3 py-1 text-sm">
                {{ page }}
              </button>
            </div>
            
            <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-pagination-modern">
              Next <font-awesome-icon icon="angle-right" class="ml-1" />
            </button>
            <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="btn-pagination-modern">
              <font-awesome-icon icon="angle-double-right" />
            </button>
          </div>
        </nav>

        <!-- No Results Message -->
        <div v-if="!loading && paginatedJobs.length === 0" class="text-center py-16">
          <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <font-awesome-icon icon="search" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs found</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filter criteria.</p>
          <button @click="clearFilters" class="btn-primary-modern">
            Clear All Filters
          </button>
        </div>
      </section>

      <!-- Enhanced Analytics Section -->
      <section class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Job Booking Trend Chart -->
        <div class="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <font-awesome-icon icon="chart-line" class="text-indigo-600 dark:text-indigo-400" />
              Job Booking Trend
            </h3>
            <div class="flex items-center gap-2">
              <select v-model="chartPeriod" @change="updateChart" class="input-modern input-modern--select text-sm py-1">
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          <div class="relative w-full h-64">
            <canvas ref="jobBookingTrendChart"></canvas>
          </div>
        </div>

        <!-- Status Distribution -->
        <div class="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <font-awesome-icon icon="chart-pie" class="text-indigo-600 dark:text-indigo-400" />
            Job Status Distribution
            <span v-if="activeFiltersCount > 0" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
              Filtered
            </span>
          </h3>
          <div class="space-y-3">
            <div v-for="status in statusStats" :key="status.name" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div :class="status.color" class="w-3 h-3 rounded-full"></div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ status.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ status.count }}</span>
                <div class="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div :class="status.color" class="h-full transition-all duration-500" :style="{ width: `${status.percentage}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Job Form Modal using JobFormModal component -->
    <JobFormModal 
      v-model="showJobFormModal" 
      :customer-data="selectedCustomerForJob"
      :job-data="editingJob"
      @job-saved="handleJobSaved"
    />

    <!-- Global Job View Modal -->
    <GlobalJobViewModal />

    <!-- Action Menu for Jobs -->
    <teleport to="body">
      <div v-if="showActionMenu" @click="showActionMenu = false" 
           class="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
        <div @click.stop class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-48">
          <div class="p-2">
            <button @click="duplicateJob(actionMenuJob)" class="action-menu-item">
              <font-awesome-icon icon="copy" class="mr-2" />
              Duplicate Job
            </button>
            <button @click="scheduleFollowUp(actionMenuJob)" class="action-menu-item">
              <font-awesome-icon icon="calendar-plus" class="mr-2" />
              Schedule Follow-up
            </button>
            <button @click="generateInvoice(actionMenuJob)" class="action-menu-item">
              <font-awesome-icon icon="file-invoice" class="mr-2" />
              Generate Invoice
            </button>
            <button @click="exportJobDetails(actionMenuJob)" class="action-menu-item">
              <font-awesome-icon icon="download" class="mr-2" />
              Export Details
            </button>
            <hr class="my-1 border-gray-200 dark:border-gray-700">
            <button @click="deleteJob(actionMenuJob)" class="action-menu-item text-red-600 dark:text-red-400">
              <font-awesome-icon icon="trash" class="mr-2" />
              Delete Job
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

/*
 * FINANCIAL CALCULATIONS NOTE:
 * This component calculates job financials from actual payment and expense data.
 * 
 * Backend Requirements:
 * The jobs API endpoint needs to include both 'payments' and 'expenses' relations:
 * 
 * In your jobs controller (jobs.ts), update the select statement to include:
 * ```javascript
 * payments: {
 *   select: {
 *     id: true,
 *     amountInCents: true,
 *     status: true,
 *     createdAt: true
 *   }
 * },
 * expenses: {
 *   select: {
 *     id: true,
 *     amount: true,
 *     description: true,
 *     type: true,
 *     createdAt: true
 *   }
 * }
 * ```
 */

<script setup>
import { ref, computed, onMounted, onUnmounted, watchEffect, reactive, watch, nextTick } from 'vue'
import axios from 'axios'
import moment from 'moment'
import Chart from 'chart.js/auto'
import { useUserStore } from '@/stores/UserStore'
import { useUIStore } from '@/stores/UIStore'
import { useThemeStore } from '@/stores/theme'
import { useToast } from 'vue-toast-notification'
import { storeToRefs } from 'pinia'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCalendar, faUser, faMapMarkerAlt, faChevronDown, faCheck, faSearch, 
  faClock, faSync, faPlus, faChevronLeft, faChevronRight, faHome,
  faBriefcase, faCheckCircle, faDollarSign, faFilter, faMinus, faTimes,
  faEye, faEdit, faBell, faEllipsisH, faEllipsisV, faSort, faSortUp, 
  faSortDown, faThLarge, faTable, faDownload, faAngleLeft, faAngleRight,
  faAngleDoubleLeft, faAngleDoubleRight, faChartLine, faChartPie, 
  faCopy, faCalendarPlus, faFileInvoice, faTrash, faPhone, faUserPlus,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons'

// Import components
import JobFormModal from '@/components/jobs/JobFormModal.vue'
import GlobalJobViewModal from '@/components/jobs/GlobalJobViewModal.vue'

library.add(
  faCalendar, faUser, faMapMarkerAlt, faChevronDown, faCheck, faSearch, 
  faClock, faSync, faPlus, faChevronLeft, faChevronRight, faHome,
  faBriefcase, faCheckCircle, faDollarSign, faFilter, faMinus, faTimes,
  faEye, faEdit, faBell, faEllipsisH, faEllipsisV, faSort, faSortUp, 
  faSortDown, faThLarge, faTable, faDownload, faAngleLeft, faAngleRight,
  faAngleDoubleLeft, faAngleDoubleRight, faChartLine, faChartPie, 
  faCopy, faCalendarPlus, faFileInvoice, faTrash, faPhone, faUserPlus,
  faInfoCircle
)

// Store instances
const userStore = useUserStore()
const uiStore = useUIStore()
const themeStore = useThemeStore()
const toast = useToast()

const { currentWebsite, websites } = storeToRefs(userStore)
const { isDarkMode } = storeToRefs(themeStore)

// State
const loading = ref(false)
const jobs = ref([])
const technicians = ref([])
const showJobFormModal = ref(false)
const editingJob = ref(null)
const selectedCustomerForJob = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const showAdvancedFilters = ref(false)
const viewMode = ref('table')
const selectedJobs = ref([])
const sortKey = ref('slotStart')
const sortOrder = ref('desc')
const jobBookingTrendChart = ref(null)
const chartPeriod = ref('month')
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Window resize handler
let resizeHandler = null

// Action menu state
const showActionMenu = ref(false)
const actionMenuJob = ref(null)

// Job statuses
const JOB_STATUSES = [
  'scheduled', 'quoting', 'quoted', 'accepted', 'cancelled', 'no parts',
  'pending', 'invoiced', 'done', 'paid', 'to order parts', 'parts ordered',
  'parts arrived', 'parts installed', 'parts paid', 'parts not paid',
  'parts not installed', 'parts not ordered', 'parts not available',
  'parts not needed', 'parts not found', 'follow-up', 'waiting for price',
  'waiting for parts', 'waiting for customer', 'waiting for payment'
]

// Enhanced table headers
const enhancedTableHeaders = [
  { key: 'customer', label: 'Customer' },
  { key: 'issue', label: 'Issue' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Scheduled' },
  { key: 'technician', label: 'Technician' },
  { key: 'location', label: 'Location' },
  { key: 'financials', label: 'Financials' },
  { key: 'actions', label: 'Actions' }
]

// Filters
const filters = reactive({
  search: '',
  status: '',
  technician: '',
  location: '',
  dateRange: '',
  startDate: null,
  endDate: null,
  minRevenue: '',
  maxRevenue: ''
})

// Computed properties
const selectedWebsite = computed({
  get: () => currentWebsite.value,
  set: (value) => userStore.updateWebsite(value)
})

const opt = computed(() => [
  { label: 'Select Website', value: 'default', attrs: { disabled: true } },
  ...websites.value
])

const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSearch = !filters.search || 
      job.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.issue?.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesStatus = !filters.status || job.jobStatus === filters.status
    const matchesTechnician = !filters.technician || job.employee?.id === filters.technician
    const matchesLocation = !filters.location || 
      job.location?.toLowerCase().includes(filters.location.toLowerCase())
    
    let matchesDateRange = true
    if (filters.startDate && filters.endDate) {
      const jobDate = moment(job.slotStart)
      matchesDateRange = jobDate.isBetween(filters.startDate, filters.endDate, 'day', '[]')
    }
    
    let matchesRevenue = true
    if (filters.minRevenue || filters.maxRevenue) {
      const revenue = job.totalPayments || 0
      if (filters.minRevenue && revenue < parseFloat(filters.minRevenue)) matchesRevenue = false
      if (filters.maxRevenue && revenue > parseFloat(filters.maxRevenue)) matchesRevenue = false
    }
    
    return matchesSearch && matchesStatus && matchesTechnician && 
           matchesLocation && matchesDateRange && matchesRevenue
  })
})

const sortedJobs = computed(() => {
  const sorted = [...filteredJobs.value]
  if (sortKey.value) {
    sorted.sort((a, b) => {
      let aVal = a[sortKey.value]
      let bVal = b[sortKey.value]
      
      // Handle nested properties
      if (sortKey.value === 'customer') {
        aVal = a.name
        bVal = b.name
      } else if (sortKey.value === 'technician') {
        aVal = a.employee?.firstName || ''
        bVal = b.employee?.firstName || ''
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortOrder.value === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
  }
  return sorted
})

const totalJobs = computed(() => filteredJobs.value.length)
const totalPages = computed(() => Math.ceil(totalJobs.value / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalJobs.value))

const paginatedJobs = computed(() => {
  return sortedJobs.value.slice(startIndex.value, endIndex.value)
})

const completedJobs = computed(() => 
  filteredJobs.value.filter(job => job.jobStatus === 'done').length
)

const pendingJobs = computed(() => 
  filteredJobs.value.filter(job => ['scheduled', 'pending', 'accepted'].includes(job.jobStatus)).length
)

const totalRevenue = computed(() => 
  filteredJobs.value.reduce((sum, job) => sum + (job.totalPayments || 0), 0)
)

const statusStats = computed(() => {
  const stats = {}
  filteredJobs.value.forEach(job => {
    const status = job.jobStatus || 'unknown'
    stats[status] = (stats[status] || 0) + 1
  })
  
  const total = filteredJobs.value.length
  const colors = {
    'scheduled': 'bg-emerald-200',
    'pending': 'bg-gray-800',
    'done': 'bg-green-500',
    'cancelled': 'bg-red-600',
    'quoted': 'bg-purple-600',
    'accepted': 'bg-blue-600',
    'quoting': 'bg-blue-400',
    'no parts': 'bg-yellow-500',
    'invoiced': 'bg-green-800',
    'follow-up': 'bg-yellow-800',
    'paid': 'bg-green-500',
    'to order parts': 'bg-yellow-500',
    'parts ordered': 'bg-yellow-400',
    'parts arrived': 'bg-yellow-300',
    'parts installed': 'bg-yellow-200',
    'parts paid': 'bg-yellow-100',
    'parts not paid': 'bg-red-100',
    'parts not installed': 'bg-red-200',
    'parts not ordered': 'bg-red-300',
    'parts not available': 'bg-red-400',
    'parts not needed': 'bg-red-500',
    'parts not found': 'bg-red-600',
    'waiting for price': 'bg-gray-600',
    'waiting for parts': 'bg-gray-700',
    'waiting for customer': 'bg-gray-800',
    'waiting for payment': 'bg-gray-900',
  }
  
  return Object.entries(stats)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: colors[name] || 'bg-gray-500'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const activeFilters = computed(() => {
  const active = []
  if (filters.search) active.push({ key: 'search', label: `Search: ${filters.search}` })
  if (filters.status) active.push({ key: 'status', label: `Status: ${filters.status}` })
  if (filters.technician) {
    const tech = technicians.value.find(t => t.id === filters.technician)
    active.push({ key: 'technician', label: `Technician: ${tech?.firstName} ${tech?.lastName}` })
  }
  if (filters.location) active.push({ key: 'location', label: `Location: ${filters.location}` })
  if (filters.dateRange) active.push({ key: 'dateRange', label: `Period: ${filters.dateRange}` })
  return active
})

const activeFiltersCount = computed(() => activeFilters.value.length)

const filteringSummary = computed(() => {
  if (activeFiltersCount.value === 0) return null
  
  return {
    isFiltered: true,
    totalJobs: jobs.value.length,
    filteredJobs: filteredJobs.value.length,
    hiddenJobs: jobs.value.length - filteredJobs.value.length,
    activeFilters: activeFilters.value
  }
})

const isAllSelected = computed(() => 
  paginatedJobs.value.length > 0 && selectedJobs.value.length === paginatedJobs.value.length
)

const isDesktop = computed(() => windowWidth.value >= 768)
const isMobile = computed(() => windowWidth.value < 768)

const effectiveViewMode = computed(() => {
  // Force cards view on mobile
  if (isMobile.value) return 'cards'
  // Use selected view mode on desktop
  return viewMode.value
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1)
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const fetchJobs = async () => {
  try {
    loading.value = true
    const response = await axios.get(`jobs?id=${currentWebsite.value}&limit=1500&offset=0`)
    
    // Process jobs and calculate real financials from payments and expenses
    jobs.value = response.data.jobs.map(job => {
      const processedJob = {
        ...job,
        slotStart: moment(job.slotStart).format()
      }
      
      // Calculate financials from actual payment and expense data
      return recalculateJobFinancials(processedJob)
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    toast.error('Error getting jobs data')
  } finally {
    loading.value = false
  }
}

const calculateJobPayments = (job) => {
  // Calculate total payments for this job
  let total = 0
  
  // Sum job-specific payments
  if (job.payments && Array.isArray(job.payments)) {
    total += job.payments.reduce((sum, payment) => {
      // Only use amountInCents since amount field doesn't exist in schema
      if (payment.amountInCents) {
        return sum + (payment.amountInCents / 100) // Convert cents to currency
      }
      return sum
    }, 0)
  }
  
  return total
}

const calculateJobExpenses = (job) => {
  // Calculate total expenses for this job
  let total = 0
  
  // Sum job-specific expenses
  if (job.expenses && Array.isArray(job.expenses)) {
    total += job.expenses.reduce((sum, expense) => {
      return sum + parseFloat(expense.amount || 0)
    }, 0)
  }
  
  // Add job-level expense fields if they exist
  total += parseFloat(job.fuelExpense || 0)
  total += parseFloat(job.partsExpense || 0)
  total += parseFloat(job.calloutFee || 0)
  
  return total
}

// Helper function to recalculate financials for a single job
const recalculateJobFinancials = (job) => {
  const totalPayments = calculateJobPayments(job)
  const totalExpenses = calculateJobExpenses(job)
  const netProfit = totalPayments - totalExpenses
  
  return {
    ...job,
    totalPayments,
    totalExpenses,
    netProfit
  }
}

const fetchTechnicians = async () => {
  try {
    const response = await axios.get(`employees?id=${currentWebsite.value}`)
    technicians.value = response.data.employees
  } catch (error) {
    console.error('Error fetching technicians:', error)
  }
}

const openJobFormModal = () => {
  editingJob.value = null
  selectedCustomerForJob.value = null
  showJobFormModal.value = true
}

const editJob = (job) => {
  editingJob.value = job
  selectedCustomerForJob.value = job.customer
  showJobFormModal.value = true
}

const viewJobDetails = (jobId) => {
  uiStore.openGlobalJobModal(jobId)
}

const handleJobSaved = async () => {
  showJobFormModal.value = false
  await fetchJobs() // This will recalculate all financials with fresh data
  toast.success('Job saved successfully')
}

const notifyTechnician = async (job) => {
  try {
    await axios.post('send-job-to-technician', { job })
    toast.success('Technician notified successfully')
  } catch (error) {
    console.error('Error notifying technician:', error)
    toast.error('Failed to notify technician')
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const localJobDate = moment(date).local()
  const now = moment()
  
  if (localJobDate.isSame(now, 'day')) {
    return 'Today'
  } else if (localJobDate.isSame(now.clone().add(1, 'day'), 'day')) {
    return 'Tomorrow'
  } else if (localJobDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return 'Yesterday'
  } else {
    return localJobDate.format('MMM DD, YYYY')
  }
}

const formatTime = (date) => {
  if (!date) return ''
  return moment(date).local().format('h:mm A')
}

const formatDateForInput = (date) => {
  return date ? moment(date).format('YYYY-MM-DD') : ''
}

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'R0.00'
  
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value))
  } catch (error) {
    return `R ${Number(value).toFixed(2)}`
  }
}

const getProfitClass = (value) => {
  if (value === null || value === undefined) return 'text-gray-500'
  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
}

const getModernStatusClass = (status) => {
  const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full '
  switch (status?.toLowerCase()) {
    case 'accepted': return baseClasses + 'bg-blue-600 text-white'
    case 'quoted': return baseClasses + 'bg-purple-600 text-white'
    case 'done': return baseClasses + 'bg-green-500 text-white'
    case 'cancelled': return baseClasses + 'bg-red-600 text-white'
    case 'no parts': return baseClasses + 'bg-yellow-500 text-white'
    case 'quoting': return baseClasses + 'bg-blue-400 text-white'
    case 'scheduled': return baseClasses + 'bg-emerald-200 text-black'
    case 'pending': return baseClasses + 'bg-gray-800 text-white'
    case 'invoiced': return baseClasses + 'bg-green-800 text-white'
    case 'follow-up': return baseClasses + 'bg-yellow-800 text-white'
    case 'paid': return baseClasses + 'bg-green-500 text-white'
    case 'to order parts': return baseClasses + 'bg-yellow-500 text-white'
    case 'parts ordered': return baseClasses + 'bg-yellow-400 text-white'
    case 'parts arrived': return baseClasses + 'bg-yellow-300 text-white'
    case 'parts installed': return baseClasses + 'bg-yellow-200 text-white'
    case 'parts paid': return baseClasses + 'bg-yellow-100 text-white'
    case 'parts not paid': return baseClasses + 'bg-red-100 text-white'
    case 'parts not installed': return baseClasses + 'bg-red-200 text-white'
    case 'parts not ordered': return baseClasses + 'bg-red-300 text-white'
    case 'parts not available': return baseClasses + 'bg-red-400 text-white'
    case 'parts not needed': return baseClasses + 'bg-red-500 text-white'
    case 'parts not found': return baseClasses + 'bg-red-600 text-white'
    case 'waiting for price': return baseClasses + 'bg-gray-600 text-white'
    case 'waiting for parts': return baseClasses + 'bg-gray-700 text-white'
    case 'waiting for customer': return baseClasses + 'bg-gray-800 text-white'
    case 'waiting for payment': return baseClasses + 'bg-gray-900 text-white'
    default: return baseClasses + 'border-2 border-gray-800 text-gray-800'
  }
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'table' ? 'cards' : 'table'
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedJobs.value = []
  } else {
    selectedJobs.value = paginatedJobs.value.map(job => job.id)
  }
}

const clearSelection = () => {
  selectedJobs.value = []
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const clearFilters = () => {
  Object.assign(filters, {
    search: '',
    status: '',
    technician: '',
    location: '',
    dateRange: '',
    startDate: null,
    endDate: null,
    minRevenue: '',
    maxRevenue: ''
  })
}

const removeFilter = (key) => {
  filters[key] = key.includes('Date') ? null : ''
}

const applyDateRange = () => {
  const today = moment()
  switch (filters.dateRange) {
    case 'today':
      filters.startDate = today.clone().startOf('day').toDate()
      filters.endDate = today.clone().endOf('day').toDate()
      break
    case 'tomorrow':
      filters.startDate = today.clone().add(1, 'day').startOf('day').toDate()
      filters.endDate = today.clone().add(1, 'day').endOf('day').toDate()
      break
    case 'this_week':
      filters.startDate = today.clone().startOf('week').toDate()
      filters.endDate = today.clone().endOf('week').toDate()
      break
    case 'next_week':
      filters.startDate = today.clone().add(1, 'week').startOf('week').toDate()
      filters.endDate = today.clone().add(1, 'week').endOf('week').toDate()
      break
    case 'this_month':
      filters.startDate = today.clone().startOf('month').toDate()
      filters.endDate = today.clone().endOf('month').toDate()
      break
    default:
      filters.startDate = null
      filters.endDate = null
  }
}

const updateStartDateFilter = (event) => {
  filters.startDate = event.target.value ? moment(event.target.value).toDate() : null
}

const updateEndDateFilter = (event) => {
  filters.endDate = event.target.value ? moment(event.target.value).toDate() : null
}

const showJobActions = (job) => {
  actionMenuJob.value = job
  showActionMenu.value = true
}

const duplicateJob = (job) => {
  const newJob = { ...job }
  delete newJob.id
  newJob.name = `${job.name} (Copy)`
  editingJob.value = newJob
  selectedCustomerForJob.value = job.customer
  showJobFormModal.value = true
  showActionMenu.value = false
}

const scheduleFollowUp = (job) => {
  // Implement follow-up scheduling
  toast.info('Follow-up scheduling feature coming soon')
  showActionMenu.value = false
}

const generateInvoice = (job) => {
  // Implement invoice generation
  toast.info('Invoice generation feature coming soon')
  showActionMenu.value = false
}

const exportJobDetails = (job) => {
  // Implement job export
  const jobData = {
    id: job.id,
    customer: job.name,
    issue: job.issue,
    status: job.jobStatus,
    date: formatDate(job.slotStart),
    technician: `${job.employee?.firstName || ''} ${job.employee?.lastName || ''}`,
    location: job.location
  }
  
  const blob = new Blob([JSON.stringify(jobData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `job_${job.id}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  showActionMenu.value = false
  toast.success('Job details exported')
}

const deleteJob = async (job) => {
  if (confirm(`Are you sure you want to delete job for ${job.name}? This action cannot be undone.`)) {
    try {
      await axios.delete(`/job?custId=${job.id}&id=${currentWebsite.value}`)
      toast.success('Job deleted successfully')
      fetchJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
    }
  }
  showActionMenu.value = false
}

const bulkUpdateStatus = () => {
  // Implement bulk status update
  toast.info('Bulk status update feature coming soon')
}

const bulkAssignTechnician = () => {
  // Implement bulk technician assignment
  toast.info('Bulk technician assignment feature coming soon')
}

const bulkExport = () => {
  // Implement bulk export
  const selectedJobsData = jobs.value
    .filter(job => selectedJobs.value.includes(job.id))
    .map(job => ({
      id: job.id,
      customer: job.name,
      issue: job.issue,
      status: job.jobStatus,
      date: formatDate(job.slotStart),
      technician: `${job.employee?.firstName || ''} ${job.employee?.lastName || ''}`,
      location: job.location
    }))
  
  const blob = new Blob([JSON.stringify(selectedJobsData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jobs_export_${moment().format('YYYY-MM-DD')}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  toast.success(`${selectedJobs.value.length} jobs exported`)
  clearSelection()
}

const exportJobs = () => {
  // Export all filtered jobs
  const exportData = filteredJobs.value.map(job => ({
    id: job.id,
    customer: job.name,
    issue: job.issue,
    status: job.jobStatus,
    date: formatDate(job.slotStart),
    technician: `${job.employee?.firstName || ''} ${job.employee?.lastName || ''}`,
    location: job.location,
    revenue: formatCurrency(job.totalPayments || 0),
    expenses: formatCurrency(job.totalExpenses || 0),
    profit: formatCurrency(job.netProfit || 0)
  }))
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `all_jobs_${moment().format('YYYY-MM-DD')}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  toast.success('All jobs exported')
}

const reloadJobs = async () => {
  await fetchJobs() // Fetch fresh data and recalculate financials
  createCharts()
  toast.success('Jobs reloaded')
}

const refreshTable = async () => {
  await fetchJobs() // This will recalculate financials from fresh data
}

const updateChart = () => {
  createCharts()
}

const createCharts = () => {
  if (!jobBookingTrendChart.value) return
  
  Chart.register()
  
  const existingChart = Chart.getChart(jobBookingTrendChart.value)
  if (existingChart) {
    existingChart.destroy()
  }
  
  const ctx = jobBookingTrendChart.value.getContext('2d')
  const currentYearData = processBookingData(jobs.value, 0)
  const lastYearData = processBookingData(jobs.value, 1)
  
  const monthLabels = moment.monthsShort()
  
  new Chart(jobBookingTrendChart.value, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: 'This Year',
          data: currentYearData.data,
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(79, 70, 229)',
        },
        {
          label: 'Last Year',
          data: lastYearData.data,
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          fill: true,
          tension: 0.4,
          pointStyle: 'dash',
          pointBackgroundColor: 'rgb(156, 163, 175)',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',
          grid: { display: false },
          ticks: { color: isDarkMode.value ? '#9ca3af' : '#6b7280', maxRotation: 0, autoSkip: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: isDarkMode.value ? '#9ca3af' : '#6b7280', precision: 0, stepSize: 5 },
        }
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          labels: {
            color: isDarkMode.value ? '#f3f4f6' : '#111827'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: isDarkMode.value ? '#1f2937' : '#ffffff',
          titleColor: isDarkMode.value ? '#f3f4f6' : '#111827',
          bodyColor: isDarkMode.value ? '#d1d5db' : '#374151',
          borderColor: isDarkMode.value ? '#374151' : '#e5e7eb',
          borderWidth: 1,
          padding: 10,
        }
      },
      interaction: { intersect: false, mode: 'index' },
    }
  })
}

const processBookingData = (jobs, yearOffset = 0) => {
  const targetYear = moment().subtract(yearOffset, 'years').year()
  const monthlyCounts = Array(12).fill(0)
  
  jobs
    .filter(job => moment(job.createdAt).year() === targetYear)
    .forEach(job => {
      const monthIndex = moment(job.createdAt).month()
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyCounts[monthIndex]++
      }
    })
  
  if (yearOffset === 0) {
    const currentMonthIndex = moment().month()
    for (let i = currentMonthIndex + 1; i < 12; i++) {
      monthlyCounts[i] = null
    }
  }
  
  return { data: monthlyCounts }
}

// Lifecycle hooks
onMounted(() => {
  // Set up window resize listener
  if (typeof window !== 'undefined') {
    const handleResize = () => {
      windowWidth.value = window.innerWidth
    }
    
    windowWidth.value = window.innerWidth
    window.addEventListener('resize', handleResize)
    resizeHandler = handleResize
  }
  
  if (currentWebsite.value) {
    fetchJobs().then(() => {
      if (jobs.value.length > 0) {
        nextTick(() => createCharts())
      }
    })
    fetchTechnicians()
  }
})

onUnmounted(() => {
  // Cleanup window resize listener
  if (typeof window !== 'undefined' && resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})

watchEffect(() => {
  if (currentWebsite.value) {
    currentPage.value = 1
    fetchJobs().then(() => {
      if (jobs.value.length > 0) {
        nextTick(() => createCharts())
      }
    })
    fetchTechnicians()
  }
})

// Watch for pagination changes
watch([currentPage, itemsPerPage], () => {
  selectedJobs.value = []
})
</script>

<style scoped>
/* Enhanced styling */
.enhanced-card-modern {
  @apply bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 transition-all duration-300;
  @apply hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300/50 dark:hover:border-blue-600/50;
}

.stat-card-modern {
  @apply bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4;
}

.stat-icon-modern {
  @apply w-10 h-10 rounded-lg flex items-center justify-center;
}

.input-modern {
  @apply block w-full py-2 px-3 text-sm text-gray-900 dark:text-white bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:ring-indigo-400/50 dark:focus:border-indigo-400;
  @apply transition-all duration-200 ease-in-out;
}

.input-modern--select {
  @apply pr-10 appearance-none bg-no-repeat bg-right;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-size: 1.5em 1.5em;
}

.dark .input-modern--select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

.btn-primary-modern {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800;
  @apply transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95;
}

.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50;
  @apply transition-all duration-200 ease-in-out;
}

.btn-ghost-modern {
  @apply inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 rounded-lg;
  @apply hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50;
  @apply transition-all duration-200 ease-in-out;
}

.btn-icon-modern {
  @apply inline-flex items-center justify-center w-9 h-9 text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50;
  @apply transition-all duration-200 ease-in-out;
}

.btn-pagination-modern {
  @apply inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 rounded-lg;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-all duration-200 ease-in-out;
}

.th-modern {
  @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.td-modern {
  @apply px-4 py-3 text-sm;
}

.status-badge-modern {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap;
}

.action-menu-item {
  @apply w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center rounded-md transition-colors;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Enhanced animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.enhanced-card-modern {
  animation: slideInUp 0.3s ease-out;
}

/* Glass morphism effect */
.glass-morphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-morphism {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>