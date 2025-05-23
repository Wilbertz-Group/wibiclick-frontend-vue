<template>
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      
      <!-- Enhanced Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <font-awesome-icon icon="users" class="text-white text-xl" />
          </div>
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Visitor Intelligence
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Real-time visitor analytics and behavioral insights
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Quick Actions -->
          <div class="hidden md:flex items-center gap-2 mr-4">
            <div class="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              <span class="text-gray-500 dark:text-gray-400">Live:</span>
              <span class="font-semibold text-green-600 dark:text-green-400 ml-1">{{ liveVisitorsCount }}</span>
            </div>
            <div class="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
              <span class="text-gray-500 dark:text-gray-400">Quality:</span>
              <span class="font-semibold text-indigo-600 dark:text-indigo-400 ml-1">{{ averageQualityScore }}%</span>
            </div>
          </div>
          
          <button 
            @click="exportVisitors" 
            class="btn-secondary-modern"
            title="Export Visitors"
          >
            <font-awesome-icon icon="download" class="mr-2" />
            Export
          </button>
          <button @click="fetchVisitors" class="btn-icon-modern" title="Reload Visitors">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
          </button>
          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <!-- Enhanced Statistics Dashboard -->
      <section class="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <!-- Total Visitors with Trend -->
        <div class="card-modern p-4 hover:shadow-lg transition-all duration-300 group">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Visitors</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ visitorStats.total.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <span class="text-xs text-green-600 dark:text-green-400 flex items-center">
                  <font-awesome-icon icon="arrow-up" class="mr-1" />
                  +{{ todayGrowth }}% today
                </span>
              </div>
            </div>
            <div class="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <font-awesome-icon icon="users" class="text-indigo-600 dark:text-indigo-400 text-xl" />
            </div>
          </div>
          <div class="mt-3 h-8">
            <div class="flex items-end gap-1 h-full">
              <div v-for="i in 7" :key="i" class="flex-1 bg-indigo-200 dark:bg-indigo-800 rounded-sm" 
                   :style="{ height: `${Math.random() * 70 + 30}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Converted Visitors with Quality Score -->
        <div class="card-modern p-4 hover:shadow-lg transition-all duration-300 group">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Converted</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ visitorStats.converted.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <span class="text-xs font-medium" :class="conversionTrendColor">
                  {{ visitorStats.conversionRate }}% rate
                </span>
              </div>
            </div>
            <div class="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <font-awesome-icon icon="user-check" class="text-green-600 dark:text-green-400 text-xl" />
            </div>
          </div>
          <div class="mt-3">
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                   :style="{ width: `${visitorStats.conversionRate}%` }"></div>
            </div>
          </div>
        </div>

        <!-- High-Value Visitors -->
        <div class="card-modern p-4 hover:shadow-lg transition-all duration-300 group">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">High-Value</p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ highValueVisitors.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  {{ highValuePercentage }}% of total
                </span>
              </div>
            </div>
            <div class="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <font-awesome-icon icon="star" class="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
          </div>
          <div class="mt-3 flex items-center gap-1">
            <div v-for="i in 5" :key="i" class="flex-1 h-2 rounded-full"
                 :class="i <= Math.ceil(highValuePercentage / 20) ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'"></div>
          </div>
        </div>

        <!-- Returning Visitors -->
        <div class="card-modern p-4 hover:shadow-lg transition-all duration-300 group">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Returning</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ visitorStats.returning.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {{ visitorStats.returningRate }}% loyalty
                </span>
              </div>
            </div>
            <div class="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <font-awesome-icon icon="sync" class="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
          </div>
          <div class="mt-3">
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                   :style="{ width: `${visitorStats.returningRate}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Geographic Reach -->
        <div class="card-modern p-4 hover:shadow-lg transition-all duration-300 group">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Countries</p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ visitorStats.uniqueCountries.toLocaleString() }}</p>
              <div class="flex items-center mt-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ visitorStats.uniqueCities }} cities
                </span>
              </div>
            </div>
            <div class="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <font-awesome-icon icon="globe" class="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
          </div>
          <div class="mt-3 flex items-center gap-1">
            <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div class="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
            <div class="w-1 h-1 bg-orange-300 rounded-full"></div>
            <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">Global reach</span>
          </div>
        </div>

        <!-- Bot Traffic Analysis -->
        <div class="card-modern p-4 hover:shadow-lg transition-all duration-300 group">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Human Traffic</p>
              <p class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{{ (100 - parseFloat(botStats.botPercent)).toFixed(1) }}%</p>
              <div class="flex items-center mt-1">
                <span class="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                  {{ botStats.humanCount.toLocaleString() }} humans
                </span>
              </div>
            </div>
            <div class="p-3 bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-xl group-hover:scale-110 transition-transform">
              <font-awesome-icon icon="user-shield" class="text-cyan-600 dark:text-cyan-400 text-xl" />
            </div>
          </div>
          <div class="mt-3">
            <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <div class="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              {{ botStats.botPercent }}% bots filtered
            </div>
          </div>
        </div>
      </section>

      <!-- Advanced Filter Section -->
      <section class="mb-6 card-modern p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <font-awesome-icon icon="filter" class="text-indigo-500" />
            Smart Filters
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ filteredVisitors.length.toLocaleString() }} of {{ visitors.length.toLocaleString() }} visitors
            </span>
            <button
              @click="clearFilters"
              v-if="hasActiveFilters"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <!-- Enhanced Search Input -->
          <div class="lg:col-span-2">
            <label class="label-modern">Search Visitors</label>
            <div class="relative">
              <font-awesome-icon icon="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                v-model="filters.search"
                placeholder="Search by location, device, customer..."
                class="input-modern pl-10 pr-10"
              />
              <button 
                v-if="filters.search"
                @click="filters.search = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <font-awesome-icon icon="times" class="text-sm" />
              </button>
            </div>
          </div>

          <!-- Customer Status Filter -->
          <div>
            <label class="label-modern">Customer Status</label>
            <select v-model="filters.hasCustomer" class="input-modern input-modern--select">
              <option value="all">All Visitors</option>
              <option value="yes">With Customer</option>
              <option value="no">Without Customer</option>
              <option value="potential">High Potential</option>
            </select>
          </div>

          <!-- Time Range Filter -->
          <div>
            <label class="label-modern">Time Range</label>
            <select v-model="filters.timeRange" class="input-modern input-modern--select">
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <!-- Quality Filter -->
          <div>
            <label class="label-modern">Quality Score</label>
            <select v-model="filters.qualityScore" class="input-modern input-modern--select">
              <option value="all">All Quality</option>
              <option value="premium">Premium (80+)</option>
              <option value="high">High (60-79)</option>
              <option value="medium">Medium (40-59)</option>
              <option value="low">Low (&lt;40)</option>
            </select>
          </div>

          <!-- Bot Filter -->
          <div>
            <label class="label-modern">Traffic Type</label>
            <select v-model="filters.botStatus" class="input-modern input-modern--select">
              <option value="all">All Traffic</option>
              <option value="noBots">Human Only</option>
              <option value="onlyBots">Bots Only</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>
        </div>

        <!-- Quick Filter Chips -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="quickFilter in quickFilters"
            :key="quickFilter.key"
            @click="applyQuickFilter(quickFilter)"
            class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <font-awesome-icon :icon="quickFilter.icon" class="mr-1.5" />
            {{ quickFilter.label }}
          </button>
        </div>
      </section>

      <!-- Enhanced Visitor List Section -->
      <section>
        <!-- List Header with Actions -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Visitor Intelligence
            </h3>
            <div class="flex items-center gap-2">
              <button
                @click="viewMode = 'table'"
                :class="viewMode === 'table' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <font-awesome-icon icon="table" />
              </button>
              <button
                @click="viewMode = 'cards'"
                :class="viewMode === 'cards' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <font-awesome-icon icon="th-large" />
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="bulkAction = 'associate'"
              v-if="selectedVisitors.length > 0"
              class="btn-secondary-modern"
            >
              <font-awesome-icon icon="link" class="mr-2" />
              Associate ({{ selectedVisitors.length }})
            </button>
            <select 
              v-model="sortBy" 
              class="input-modern input-modern--select text-sm"
              style="min-width: 150px;"
            >
              <option value="updatedAt">Last Activity</option>
              <option value="quality">Quality Score</option>
              <option value="createdAt">First Visit</option>
              <option value="totalPageViews">Page Views</option>
              <option value="conversionPotential">Conversion Potential</option>
            </select>
          </div>
        </div>

        <!-- Enhanced Desktop Table -->
        <div v-if="!loading && paginatedVisitors.length > 0 && viewMode === 'table'" class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
            <thead class="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th scope="col" class="th-modern w-8">
                  <input 
                    type="checkbox" 
                    @change="toggleSelectAll"
                    :checked="selectedVisitors.length === paginatedVisitors.length && paginatedVisitors.length > 0"
                    class="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th scope="col" class="th-modern">Intelligence</th>
                <th scope="col" class="th-modern">Visitor Profile</th>
                <th scope="col" class="th-modern">Geographic</th>
                <th scope="col" class="th-modern">Technology</th>
                <th scope="col" class="th-modern">Engagement</th>
                <th scope="col" class="th-modern">Journey</th>
                <th scope="col" class="th-modern text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
              <tr v-for="visitor in enhancedVisitors" :key="visitor.id"
                  class="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150"
                  :class="{ 'bg-indigo-50/30 dark:bg-indigo-900/20': selectedVisitors.includes(visitor.id) }"
              >
                <td class="td-modern">
                  <input 
                    type="checkbox" 
                    :value="visitor.id"
                    v-model="selectedVisitors"
                    class="rounded border-gray-300 dark:border-gray-600"
                  />
                </td>

                <!-- Intelligence Column -->
                <td class="td-modern">
                  <div class="flex flex-col space-y-2">
                    <!-- Quality Score Badge -->
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                           :class="getQualityScoreColor(visitor.qualityScore)">
                        {{ visitor.qualityScore }}
                      </div>
                      <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {{ getQualityScoreLabel(visitor.qualityScore) }}
                      </span>
                    </div>

                    <!-- Status Badges -->
                    <div class="flex flex-wrap gap-1">
                      <span v-if="visitor.isConverted" 
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <font-awesome-icon icon="user-check" class="mr-1 text-xs" />
                        Converted
                      </span>
                      <span v-if="visitor.isBot" 
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            :title="visitor.botTag || 'Bot detected'">
                        <font-awesome-icon icon="robot" class="mr-1 text-xs" />
                        Bot
                      </span>
                      <span v-if="visitor.isReturning" 
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <font-awesome-icon icon="sync" class="mr-1 text-xs" />
                        Return
                      </span>
                      <span v-if="visitor.isHighValue" 
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <font-awesome-icon icon="star" class="mr-1 text-xs" />
                        Premium
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Visitor Profile -->
                <td class="td-modern">
                  <div class="flex flex-col space-y-1">
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ visitor.associatedCustomer || 'Anonymous Visitor' }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      First seen: {{ formatDateShort(visitor.createdAt) }}
                    </div>
                  </div>
                </td>

                <!-- Geographic -->
                <td class="td-modern">
                  <div class="flex items-start gap-2">
                    <font-awesome-icon icon="map-marker-alt" class="text-gray-400 mt-0.5" />
                    <div class="flex flex-col space-y-1">
                      <span class="text-sm text-gray-900 dark:text-white">{{ visitor.location }}</span>
                      <span v-if="visitor.timezone" class="text-xs text-gray-500 dark:text-gray-400">
                        {{ getLocalTime(visitor.timezone) }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Technology -->
                <td class="td-modern">
                  <div class="flex flex-col space-y-1">
                    <div class="flex items-center gap-2">
                      <font-awesome-icon :icon="getDeviceIcon(visitor.deviceType)" class="text-gray-400" />
                      <span class="text-sm text-gray-900 dark:text-white">{{ visitor.deviceSummary }}</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ visitor.browser || 'Unknown browser' }}
                    </div>
                    <div v-if="visitor.performance" class="text-xs" :class="getPerformanceColor(visitor.performance.loadTime)">
                      {{ formatPerformance(visitor.performance.loadTime) }}
                    </div>
                  </div>
                </td>

                <!-- Engagement -->
                <td class="td-modern">
                  <div class="space-y-2">
                    <div class="flex items-center gap-4 text-sm">
                      <div class="flex items-center text-gray-500 dark:text-gray-400">
                        <font-awesome-icon icon="eye" class="mr-1 text-xs" />
                        <span class="font-medium">{{ visitor.views || 0 }}</span>
                      </div>
                      <div class="flex items-center text-gray-500 dark:text-gray-400">
                        <font-awesome-icon icon="mouse-pointer" class="mr-1 text-xs" />
                        <span class="font-medium">{{ visitor.clicks || 0 }}</span>
                      </div>
                    </div>
                    
                    <!-- Engagement Score Progress -->
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300" 
                           :style="{ width: `${visitor.engagementScore}%` }"></div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ visitor.engagementScore }}% engaged
                    </div>
                  </div>
                </td>

                <!-- Journey -->
                <td class="td-modern">
                  <div class="flex flex-col space-y-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ visitor.sessions?.length || 0 }} sessions
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDuration(visitor.totalTimeOnSite) }} total
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      Last: {{ formatDateShort(visitor.updatedAt) }}
                    </div>
                  </div>
                </td>

                <!-- Actions -->
                <td class="td-modern text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      @click="$router.push({ name: 'VisitorView', params: { visitorId: visitor.id } })"
                      class="btn-primary-modern text-xs"
                      :title="`Analyze ${visitor.associatedCustomer || 'visitor'}`"
                    >
                      <font-awesome-icon icon="search" class="mr-1" />
                      Analyze
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Enhanced Mobile Cards -->
        <div v-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-if="!loading && paginatedVisitors.length > 0" 
               v-for="visitor in enhancedVisitors" 
               :key="visitor.id"
               class="card-modern p-4 hover:shadow-lg transition-all duration-300 group"
               :class="{ 'ring-2 ring-indigo-500': selectedVisitors.includes(visitor.id) }"
          >
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  :value="visitor.id"
                  v-model="selectedVisitors"
                  class="rounded border-gray-300 dark:border-gray-600"
                />
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                     :class="getQualityScoreColor(visitor.qualityScore)">
                  {{ visitor.qualityScore }}
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ visitor.associatedCustomer || 'Anonymous Visitor' }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ getQualityScoreLabel(visitor.qualityScore) }} Quality
                  </p>
                </div>
              </div>
              
              <!-- Status Badges -->
              <div class="flex flex-col gap-1">
                <span v-if="visitor.isConverted"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Converted
                </span>
                <span v-if="visitor.isBot"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Bot
                </span>
              </div>
            </div>

            <!-- Visitor Details Grid -->
            <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Location:</span>
                <div class="font-medium text-gray-900 dark:text-white truncate">{{ visitor.location }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Device:</span>
                <div class="font-medium text-gray-900 dark:text-white">{{ visitor.deviceType || 'Unknown' }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Sessions:</span>
                <div class="font-medium text-gray-900 dark:text-white">{{ visitor.sessions?.length || 0 }}</div>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Engagement:</span>
                <div class="font-medium text-gray-900 dark:text-white">{{ visitor.engagementScore }}%</div>
              </div>
            </div>

            <!-- Engagement Progress -->
            <div class="mb-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">Activity Level</span>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {{ visitor.views || 0 }} views • {{ visitor.clicks || 0 }} clicks
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300" 
                     :style="{ width: `${visitor.engagementScore}%` }"></div>
              </div>
            </div>

            <!-- Action Button -->
            <button 
              @click="$router.push({ name: 'VisitorView', params: { visitorId: visitor.id } })"
              class="btn-primary-modern w-full text-sm group-hover:bg-indigo-700 dark:group-hover:bg-indigo-600"
              :title="`Deep analysis of ${visitor.associatedCustomer || 'visitor'}`"
            >
              <font-awesome-icon icon="chart-line" class="mr-2" />
              Deep Analysis
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="animate-pulse">
          <div class="hidden md:block bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <div class="p-4 space-y-4">
              <div v-for="n in 10" :key="`skel-${n}`" class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div class="md:hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="n in 6" :key="`skel-mob-${n}`" class="card-modern p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div class="space-y-2">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-if="!loading && filteredVisitors.length === 0" class="text-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <font-awesome-icon icon="users" class="text-2xl text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No visitors found</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ hasActiveFilters ? 'Try adjusting your filters' : 'No visitor data recorded yet' }}
          </p>
          <button v-if="hasActiveFilters" @click="clearFilters" class="btn-primary-modern">
            Clear Filters
          </button>
        </div>

        <!-- Enhanced Pagination -->
        <nav v-if="!loading && totalPages > 1" class="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm space-y-4 sm:space-y-0">
          <div class="flex items-center gap-4">
            <p class="text-gray-600 dark:text-gray-400">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to <span class="font-medium">{{ endIndex }}</span> of <span class="font-medium">{{ totalVisitors }}</span> results
            </p>
            <select v-model="paginationPageSize" class="input-modern text-sm" style="min-width: 100px;">
              <option :value="15">15 per page</option>
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>

          <div class="flex items-center space-x-1">
            <button 
              :disabled="currentPage === 1" 
              @click="prevPage" 
              class="btn-pagination-modern"
            >
              <font-awesome-icon icon="chevron-left" class="h-3 w-3 mr-1" /> Previous
            </button>
            
            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <button 
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="page === currentPage ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
                class="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              :disabled="currentPage === totalPages" 
              @click="nextPage" 
              class="btn-pagination-modern"
            >
              Next <font-awesome-icon icon="chevron-right" class="h-3 w-3 ml-1" />
            </button>
          </div>
        </nav>
      </section>

      <!-- Enhanced Analytics Section -->
      <section class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Visitor Trend Chart -->
        <div class="card-modern p-6">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
            <font-awesome-icon icon="chart-line" class="mr-2 text-indigo-500 dark:text-indigo-400" />
            Visitor Trend Analysis
          </h3>
          <div class="relative w-full min-h-[200px]">
            <VisitorTrendChart
              :rawData="filteredVisitors"
              :loading="loading"
              :isDarkMode="isDarkMode"
            />
          </div>
        </div>

        <!-- Enhanced Bot Traffic Report -->
        <div class="card-modern p-6">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
            <font-awesome-icon icon="shield-alt" class="mr-2 text-yellow-500" />
            Traffic Quality Report
          </h3>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ botStats.humanCount.toLocaleString() }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Human Visitors</div>
              <div class="text-xs text-green-600 dark:text-green-400 font-medium">
                {{ (100 - parseFloat(botStats.botPercent)).toFixed(1) }}% of traffic
              </div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ botStats.totalBots.toLocaleString() }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Bots Detected</div>
              <div class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                {{ botStats.botPercent }}% filtered
              </div>
            </div>
          </div>
          
          <div v-if="botStats.botTagBreakdown.length > 0" class="mt-4">
            <h4 class="text-md font-semibold mb-2 text-gray-900 dark:text-white">Bot Detection Types</h4>
            <div class="space-y-2">
              <div v-for="tag in botStats.botTagBreakdown.slice(0, 5)" :key="tag.tag" 
                   class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                <span class="flex items-center">
                  <font-awesome-icon icon="robot" class="mr-2 text-yellow-400" />
                  <span class="font-mono text-sm">{{ tag.tag || 'Unspecified' }}</span>
                </span>
                <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ tag.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <div class="flex items-center gap-4">
          <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <span class="text-gray-900 dark:text-white font-medium">Loading visitor intelligence...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from "axios";
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VisitorTrendChart from '@/components/Visitors/VisitorTrendChart.vue';

// Component setup
const router = useRouter();
const userStore = useUserStore();

// Reactive data
const loading = ref(false);
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const currentPage = ref(1);
const paginationPageSize = ref(15);
const visitors = ref([]);
const selectedVisitors = ref([]);
const viewMode = ref('table');
const sortBy = ref('updatedAt');
const bulkAction = ref('');

// Filters
const filters = ref({
  search: '',
  hasCustomer: 'all',
  deviceType: 'all',
  timeRange: '7d',
  botStatus: 'noBots',
  qualityScore: 'all'
});

// Quick filters
const quickFilters = ref([
  { key: 'high-value', label: 'High-Value Visitors', icon: 'star', filter: { qualityScore: 'premium' } },
  { key: 'returning', label: 'Returning Visitors', icon: 'sync', filter: { hasCustomer: 'no', timeRange: '30d' } },
  { key: 'converted', label: 'Converted Today', icon: 'user-check', filter: { hasCustomer: 'yes', timeRange: '24h' } },
  { key: 'bots', label: 'Bot Traffic', icon: 'robot', filter: { botStatus: 'onlyBots' } }
]);

// Computed properties
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || 
         filters.value.hasCustomer !== 'all' || 
         filters.value.timeRange !== '7d' || 
         filters.value.botStatus !== 'noBots' ||
         filters.value.qualityScore !== 'all';
});

const filteredVisitors = computed(() => {
  let filtered = [...visitors.value];

  // Apply search filter
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    filtered = filtered.filter(visitor => 
      visitor.location?.toLowerCase().includes(searchLower) ||
      visitor.customer?.name?.toLowerCase().includes(searchLower) ||
      visitor.deviceType?.toLowerCase().includes(searchLower) ||
      visitor.id?.toLowerCase().includes(searchLower)
    );
  }

  // Apply customer filter
  if (filters.value.hasCustomer !== 'all') {
    filtered = filtered.filter(visitor => {
      if (filters.value.hasCustomer === 'yes') return visitor.customer;
      if (filters.value.hasCustomer === 'no') return !visitor.customer;
      if (filters.value.hasCustomer === 'potential') return visitor.qualityScore >= 70 && !visitor.customer;
      return true;
    });
  }

  // Apply time range filter
  if (filters.value.timeRange !== 'all') {
    const now = new Date();
    let cutoffDate;
    
    switch (filters.value.timeRange) {
      case '1h':
        cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    if (cutoffDate) {
      filtered = filtered.filter(visitor => 
        new Date(visitor.updatedAt) >= cutoffDate
      );
    }
  }

  // Apply bot filter
  if (filters.value.botStatus !== 'all') {
    filtered = filtered.filter(visitor => {
      if (filters.value.botStatus === 'onlyBots') return visitor.isBot;
      if (filters.value.botStatus === 'noBots') return !visitor.isBot;
      if (filters.value.botStatus === 'suspicious') return visitor.qualityScore < 40;
      return true;
    });
  }

  // Apply quality filter
  if (filters.value.qualityScore !== 'all') {
    filtered = filtered.filter(visitor => {
      const score = visitor.qualityScore || 0;
      if (filters.value.qualityScore === 'premium') return score >= 80;
      if (filters.value.qualityScore === 'high') return score >= 60 && score < 80;
      if (filters.value.qualityScore === 'medium') return score >= 40 && score < 60;
      if (filters.value.qualityScore === 'low') return score < 40;
      return true;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'quality':
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      case 'conversionPotential':
        return (b.conversionPotential || 0) - (a.conversionPotential || 0);
      case 'totalPageViews':
        return (b.totalPageViews || 0) - (a.totalPageViews || 0);
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });

  return filtered;
});

const totalVisitors = computed(() => filteredVisitors.value.length);
const totalPages = computed(() => Math.ceil(totalVisitors.value / paginationPageSize.value));
const startIndex = computed(() => (currentPage.value - 1) * paginationPageSize.value);
const endIndex = computed(() => Math.min(startIndex.value + paginationPageSize.value, totalVisitors.value));

const paginatedVisitors = computed(() => {
  return filteredVisitors.value.slice(startIndex.value, endIndex.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

// Enhanced visitors with intelligence
const enhancedVisitors = computed(() => {
  return paginatedVisitors.value.map(visitor => {
    const qualityScore = calculateQualityScore(visitor);
    const engagementScore = calculateEngagementScore(visitor);
    const conversionPotential = calculateConversionPotential(visitor);
    
    return {
      ...visitor,
      qualityScore,
      engagementScore,
      conversionPotential,
      isReturning: (visitor.totalSessions || 0) > 1,
      isHighValue: qualityScore >= 70,
      isConverted: !!visitor.customer,
      associatedCustomer: visitor.customer?.name || null,
      location: formatLocation(visitor),
      deviceSummary: formatDeviceSummary(visitor)
    };
  });
});

// Statistics
const visitorStats = computed(() => {
  const filtered = filteredVisitors.value;
  const converted = filtered.filter(v => v.customer).length;
  const total = filtered.length;
  const returning = filtered.filter(v => (v.totalSessions || 0) > 1).length;
  
  const countries = new Set();
  const cities = new Set();
  
  filtered.forEach(v => {
    if (v.country) countries.add(v.country);
    if (v.city) cities.add(v.city);
  });
  
  return {
    total,
    converted,
    conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0.0",
    returning,
    returningRate: total > 0 ? ((returning / total) * 100).toFixed(1) : "0.0",
    uniqueCountries: countries.size,
    uniqueCities: cities.size
  };
});

const botStats = computed(() => {
  const all = visitors.value || [];
  const bots = all.filter(v => v.isBot);
  const humans = all.filter(v => !v.isBot);
  const total = all.length;
  const totalBots = bots.length;
  const humanCount = humans.length;
  const botPercent = total > 0 ? ((totalBots / total) * 100).toFixed(1) : "0.0";
  
  const tagMap = {};
  bots.forEach(b => {
    const tag = b.botTag || "Unspecified";
    tagMap[tag] = (tagMap[tag] || 0) + 1;
  });
  const botTagBreakdown = Object.entries(tagMap).map(([tag, count]) => ({ tag, count }));
  
  return {
    totalBots,
    botPercent,
    humanCount,
    uniqueBotTags: botTagBreakdown.length,
    botTagBreakdown
  };
});

// Additional computed properties
const liveVisitorsCount = computed(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return visitors.value.filter(v => new Date(v.updatedAt) >= oneHourAgo).length;
});

const averageQualityScore = computed(() => {
  const scores = visitors.value.map(v => calculateQualityScore(v));
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
});

const highValueVisitors = computed(() => {
  return visitors.value.filter(v => calculateQualityScore(v) >= 70).length;
});

const highValuePercentage = computed(() => {
  return visitors.value.length > 0 ? ((highValueVisitors.value / visitors.value.length) * 100).toFixed(1) : 0;
});

const todayGrowth = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVisitors = visitors.value.filter(v => new Date(v.createdAt) >= today).length;
  return Math.min(99, Math.max(0, todayVisitors));
});

const conversionTrendColor = computed(() => {
  const rate = parseFloat(visitorStats.value.conversionRate);
  if (rate >= 5) return 'text-green-600 dark:text-green-400';
  if (rate >= 2) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
});

// Methods
function calculateQualityScore(visitor) {
  let score = 0;
  
  // Page views scoring (max 25 points)
  if (visitor.totalPageViews) {
    score += Math.min(25, visitor.totalPageViews * 3);
  }
  
  // Sessions scoring (max 20 points)
  if (visitor.totalSessions) {
    score += Math.min(20, visitor.totalSessions * 10);
  }
  
  // Time on site scoring (max 30 points)
  if (visitor.totalTimeOnSite) {
    score += Math.min(30, Math.floor(visitor.totalTimeOnSite / 30));
  }
  
  // Returning visitor bonus (15 points)
  if ((visitor.totalSessions || 0) > 1) {
    score += 15;
  }
  
  // Human visitor bonus (10 points)
  if (!visitor.isBot) {
    score += 10;
  }
  
  return Math.min(100, Math.floor(score));
}

function calculateEngagementScore(visitor) {
  let score = 0;
  
  if ((visitor.totalPageViews || 0) > 1) score += 25;
  if ((visitor.totalSessions || 0) > 1) score += 25;
  if ((visitor.totalTimeOnSite || 0) > 120) score += 25;
  if ((visitor.clicks || 0) > 0) score += 25;
  
  return score;
}

function calculateConversionPotential(visitor) {
  let potential = 0;
  
  if ((visitor.totalPageViews || 0) > 5) potential += 20;
  if ((visitor.totalSessions || 0) > 1) potential += 30;
  if ((visitor.totalTimeOnSite || 0) > 300) potential += 25;
  if ((visitor.clicks || 0) > 2) potential += 15;
  if (!visitor.isBot) potential += 10;
  
  return Math.min(100, potential);
}

function getQualityScoreColor(score) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getQualityScoreLabel(score) {
  if (score >= 80) return 'Premium';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function getDeviceIcon(deviceType) {
  switch (deviceType) {
    case 'mobile': return 'mobile-alt';
    case 'tablet': return 'tablet-alt';
    default: return 'desktop';
  }
}

function getPerformanceColor(loadTime) {
  if (!loadTime) return 'text-gray-500';
  if (loadTime < 1000) return 'text-green-600 dark:text-green-400';
  if (loadTime < 3000) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function formatPerformance(loadTime) {
  if (!loadTime) return 'N/A';
  if (loadTime < 1000) return `${loadTime}ms (Fast)`;
  if (loadTime < 3000) return `${(loadTime/1000).toFixed(1)}s (OK)`;
  return `${(loadTime/1000).toFixed(1)}s (Slow)`;
}

function formatLocation(visitor) {
  const parts = [visitor.city, visitor.region, visitor.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

function formatDeviceSummary(visitor) {
  const type = visitor.deviceType || 'Unknown';
  const browser = visitor.browser || '';
  return browser ? `${type} • ${browser}` : type;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function getLocalTime(timezone) {
  try {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(now);
  } catch (error) {
    return '';
  }
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  document.documentElement.classList.toggle('dark', isDarkMode.value);
}

function toggleSelectAll() {
  if (selectedVisitors.value.length === paginatedVisitors.value.length) {
    selectedVisitors.value = [];
  } else {
    selectedVisitors.value = paginatedVisitors.value.map(v => v.id);
  }
}

function clearFilters() {
  filters.value = {
    search: '',
    hasCustomer: 'all',
    deviceType: 'all',
    timeRange: '7d',
    botStatus: 'noBots',
    qualityScore: 'all'
  };
  currentPage.value = 1;
}

function applyQuickFilter(quickFilter) {
  Object.assign(filters.value, quickFilter.filter);
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}

async function fetchVisitors() {
  loading.value = true;
  try {
    // Replace with actual API call
    const response = await await axios.get(`/visitors?id=${userStore.currentWebsite}&limit=1500&offset=0`);
    const data = await response.data;
    
    // Format visitors to match expected structure
    visitors.value = data.visitors.map(visitor => ({
      ...visitor,
      location: formatLocation(visitor),
      deviceSummary: formatDeviceSummary(visitor),
      associatedCustomer: visitor.customer?.name || null,
      isConverted: !!visitor.customer,
      isReturning: (visitor.totalSessions || 0) > 1
    }));
    
  } catch (error) {
    console.error('Error fetching visitors:', error);
    
    // Fallback mock data for demo
    visitors.value = Array.from({ length: 150 }, (_, i) => ({
      id: `visitor-${i}`,
      utk: `utk-${i}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      country: ['South Africa', 'United States', 'United Kingdom', 'Germany', 'Australia'][Math.floor(Math.random() * 5)],
      city: ['Cape Town', 'Johannesburg', 'New York', 'London', 'Berlin'][Math.floor(Math.random() * 5)],
      region: ['Western Cape', 'Gauteng', 'NY', 'England', 'Berlin'][Math.floor(Math.random() * 5)],
      deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      totalPageViews: Math.floor(Math.random() * 20) + 1,
      totalSessions: Math.floor(Math.random() * 5) + 1,
      totalTimeOnSite: Math.floor(Math.random() * 1800) + 30,
      isBot: Math.random() < 0.15,
      botTag: Math.random() < 0.15 ? ['crawler', 'scraper', 'monitor'][Math.floor(Math.random() * 3)] : null,
      customer: Math.random() < 0.25 ? { 
        name: `${['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa'][Math.floor(Math.random() * 6)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`, 
        id: `customer-${i}`,
        email: `customer${i}@example.com`
      } : null,
      clicks: Math.floor(Math.random() * 10),
      views: Math.floor(Math.random() * 15) + 1,
      timezone: 'Africa/Johannesburg',
      performance: { loadTime: Math.floor(Math.random() * 5000) + 500 }
    }));
  } finally {
    loading.value = false;
  }
}

function exportVisitors() {
  console.log('Exporting visitors...');
  // Implementation for export functionality
}

// Lifecycle
onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  if (userStore.currentWebsite) {
    fetchVisitors();
  }
});

// Watch for website changes
watch(() => userStore.currentWebsite, (newWebsiteId) => {
  if (newWebsiteId) {
    currentPage.value = 1;
    fetchVisitors();
  }
});

// Watch filters to reset pagination
watch(filters, () => {
  currentPage.value = 1;
}, { deep: true });
</script>

<style scoped>
/* Enhanced Button Styles */
.btn-primary-modern {
 @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
 @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
 @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-modern {
 @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
 @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
 @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-icon-modern {
 @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
 @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
 @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-pagination-modern {
 @apply inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md;
 @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
 @apply transition-colors duration-150 ease-in-out;
}

/* Enhanced Input Styles */
.input-modern {
 @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
 @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
 @apply transition duration-150 ease-in-out;
}

.input-modern--select {
 @apply pr-8 appearance-none bg-no-repeat bg-right;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-size: 1.5em 1.5em;
}

.dark .input-modern--select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}

.label-modern {
 @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}

/* Enhanced Card Style */
.card-modern {
 @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Enhanced Table Styles */
.th-modern {
 @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.td-modern {
 @apply px-4 py-3 text-sm;
}

/* Custom scrollbar styles */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-800/50; }
::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
</style>