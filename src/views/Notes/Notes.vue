// wibiclick-frontend-vue/src/views/Notes/Notes.vue
<script setup>
	import axios from "axios";
	import moment from 'moment'
	import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue';
	import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogOverlay } from '@headlessui/vue';
	import Swal from 'sweetalert2';
	import  useUserStore  from "@/stores/UserStore";
	import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
	import { library } from '@fortawesome/fontawesome-svg-core';
	import { faStickyNote, faPlus, faStar, faTag, faEdit, faTrash, faEye, faFilter, faChartLine } from '@fortawesome/free-solid-svg-icons';
	import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';

	// Add FontAwesome icons to the library
	library.add(faStickyNote, faPlus, faStar, faTag, faEdit, faTrash, faEye, faFilter, faChartLine);

	const store = useUserStore();
	const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
	const window = ref({
		innerWidth: globalThis.window?.innerWidth || 1280
	});
	const defaultParams = ref({
		id: null,
		title: '',
		description: '',
		tag: '',
		user: '',
		thumb: '',
	});
	const isAddNoteModal = ref(false);
	const isDeleteNoteModal = ref(false);
	const isViewNoteModal = ref(false);
	const params = ref(JSON.parse(JSON.stringify(defaultParams.value)));
	const isShowNoteMenu = ref(false);
	const notesList = ref([]);
	const filterdNotesList = ref([]);
	const users = ref([]);
	const selectedTab = ref('all');
	const deletedNote = ref(null);
	const loading = ref(false);
	const searchQuery = ref('');
	const selectedNote = ref({
		id: null,
		title: '',
		description: '',
		tag: '',
		user: '',
		thumb: '',
	});

	// Statistics for notes
	const notesStats = computed(() => {
		if (!notesList.value.length) return { total: 0, favorites: 0, tags: {} };
		
		const stats = {
			total: notesList.value.length,
			favorites: notesList.value.filter(note => note.isFav).length,
			tags: {}
		};
		
		// Count notes by tag
		notesList.value.forEach(note => {
			if (note.tag) {
				stats.tags[note.tag] = (stats.tags[note.tag] || 0) + 1;
			}
		});
		
		return stats;
	});

	// Watch for dark mode changes
	watch(isDarkMode, (newVal) => {
		localStorage.setItem('darkMode', newVal);
		document.documentElement.classList.toggle('dark', newVal);
	});

	// Handle window resize
	const handleResize = () => {
		window.value.innerWidth = globalThis.window?.innerWidth || 1280;
		if (window.value.innerWidth >= 1280) {
			isShowNoteMenu.value = false;
		}
	};

	onMounted(() => {
		document.documentElement.classList.toggle('dark', isDarkMode.value);
		fetchNotes();
		fetchContacts();
		
		// Add resize listener
		globalThis.window?.addEventListener('resize', handleResize);
	});

	onUnmounted(() => {
		// Remove resize listener
		globalThis.window?.removeEventListener('resize', handleResize);
	});

	// Enhanced search function with query support
const searchNotes = () => {
	   console.log('Starting searchNotes with:', {
	       totalNotes: notesList.value.length,
	       selectedTab: selectedTab.value,
	       searchQuery: searchQuery.value
	   });
	   
	   let filtered = [...notesList.value];
	   console.log('Initial filtered count:', filtered.length);
	   
	   if (selectedTab.value === 'fav') {
	       filtered = filtered.filter((d) => d.isFav);
	       console.log('After fav filter:', filtered.length);
	   } else if (selectedTab.value !== 'all') {
	       filtered = filtered.filter((d) => d.tag === selectedTab.value);
	       console.log('After tag filter:', filtered.length);
	   }
	   
	   if (searchQuery.value.trim()) {
	       const query = searchQuery.value.toLowerCase();
	       filtered = filtered.filter(note =>
	           note.title?.toLowerCase().includes(query) ||
	           note.description?.toLowerCase().includes(query) ||
	           note.user?.toLowerCase().includes(query)
	       );
	       console.log('After search query filter:', filtered.length);
	   }
	   
	   filterdNotesList.value = filtered;
	   console.log('Final filtered notes:', filterdNotesList.value);
};

	// Watch for search query changes
	watch(searchQuery, () => {
		searchNotes();
	});

	const saveNote = async () => {
			if (!params.value.title) {
					showMessage('Title is required.', 'error');
					return false;
			}
			if (params.value.id) {
					//update task
					let note = notesList.value.find((d) => d.id === params.value.id);
					let contact = users.value.find((d) => d.id === params.value.userId);
					note.title = params.value.title;
					note.user = contact.name;
					note.userId = params.value.userId;
					note.description = params.value.description;
					note.tag = params.value.tag;
					updateNote(note);
			} else {
					//add note
					let note = {
							"id": params.value.userId,
							"title": params.value.title,
							"notes": params.value.description,
							"isFav": false,
							"tag": params.value.tag,
					};
					await addNote(note);
					await fetchNotes();
			}

			showMessage('Note has been updated successfully.', 'success');
			isAddNoteModal.value = false;
	};

	const tabChanged = (type) => {
			selectedTab.value = type;
			searchNotes();
			isShowNoteMenu.value = false;
	};

	const setFav = async (note) => {
		let item = filterdNotesList.value.find((d) => d.id === note.id);
		item.isFav = !item.isFav;
		await updateNote(item);
		let msg = item.isFav ? 'note has been added to favorite.' : 'note has been removed from favorite.';
		showMessage(`${item.user} ${msg}`, 'success');
	};

	const setTag = async (note, name = '') => {
			let item = filterdNotesList.value.find((d) => d.id === note.id);
			item.tag = name;
			await updateNote(item);
			let msg = name ? `note has been added to ${name}.` : 'note has been removed from tag.';
			showMessage(`${item.user} ${msg}`, 'success');
	};

	const deleteNoteConfirm = async (note) => {			
			setTimeout(() => {
					deletedNote.value = note;
					isDeleteNoteModal.value = true;
			});
	};

	const viewNote = (note) => {
			setTimeout(() => {
					selectedNote.value = note;
					isViewNoteModal.value = true;
			});
	};

	const editNote = (note= null) => {
			isShowNoteMenu.value = false;
			params.value = JSON.parse(JSON.stringify(defaultParams.value));

			if (note) {
				params.value = JSON.parse(JSON.stringify(note));
			}
			isAddNoteModal.value = true;
	};

	const deleteNote = async() => {
			isDeleteNoteModal.value = false;
			try {
				const response = await axios.delete('notes', {
					params: {
						id: deletedNote.value.id,
					},
				});

				if (response.status === 200) {
					showMessage('Note has been deleted successfully.', 'success');			
					await fetchNotes();					
				} else {
					showMessage('Error deleting the note', 'error');
				}
			} catch (error) {
				showMessage('Error deleting the note', 'error');
			}			
	};

	const showMessage = (msg = '', type = 'success') => {
			const toast= Swal.mixin({
					toast: true,
					position: 'top',
					showConfirmButton: false,
					timer: 3000,
					customClass: { container: 'toast' },
			});
			toast.fire({
					icon: type,
					title: msg,
					padding: '10px 20px',
			});
	};

const fetchNotes = async () => {
	   try {
	       loading.value = true;
	       console.log('Fetching notes with params:', {
	           id: store.currentWebsite,
	           limit: 1500,
	           offset: 0
	       });
	       const response = await axios.get(`notes?id=${store.currentWebsite}&limit=1500&offset=0`);
	       console.log('API Response:', response.data);
	       notesList.value = response.data.notes;
	       console.log('Notes list after assignment:', notesList.value);
	       searchNotes();
	       loading.value = false;
	   } catch (error) {
	       console.error('Error in fetchNotes:', error);
	       console.log('Error response:', error.response?.data);
	       showMessage('Error getting notes data', 'error');
	       loading.value = false;
	   }
}

	const updateNote = async (n) => {
		try {
			await axios.post(`update-note?id=${store.currentWebsite}`, n);
			fetchNotes();
		} catch (error) {
			console.log(error)
			showMessage('Error updating notes data', 'error');
		}
	}

const addNote = async (n) => {
	   try {
	       console.log('Adding note with data:', n);
	       const response = await axios.post(`add-notes?id=${store.currentWebsite}`, n);
	       console.log('Add note response:', response.data);
	       await searchNotes();
	       let msg = 'note has been added to ' + n.tag;
	       showMessage(`${n.user} ${msg}`, 'success');
	   } catch (error) {
	       console.error('Error in addNote:', error);
	       console.log('Error response:', error.response?.data);
	       showMessage('Error updating notes data', 'error');
	   }
}

	const fetchContacts = async() => {
		try {
			const response = await axios.get(`customers?id=${store.currentWebsite}&limit=10000&offset=0`);

			let contacts = [];

			for (const contact of response.data.customers) {
				contacts.push({ name: contact.name, id: contact.id })
			}

			users.value = contacts
		} catch (error) {
			console.log(error)
			showMessage('Error getting contacts data', 'error');
		}
	}

	// Enhanced card class function with more subtle gradients and hover effect
	const getCardClass = (note) => {
		// Added transform for scaling effect on hover
		const baseClass = 'note-card transition-all duration-300 ease-in-out hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transform';
		
		// Adjusted gradients for more subtlety and consistency
		switch (note.tag) {
			case 'pending':
				return `${baseClass} bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-950/50 dark:via-blue-900/40 dark:to-indigo-900/40 border-l-4 border-blue-400 dark:border-blue-600`;
			case 'attention':
				return `${baseClass} bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 dark:from-amber-950/50 dark:via-amber-900/40 dark:to-yellow-900/40 border-l-4 border-amber-400 dark:border-amber-600`;
			case 'general':
				return `${baseClass} bg-gradient-to-br from-cyan-50 via-cyan-100 to-sky-100 dark:from-cyan-950/50 dark:via-cyan-900/40 dark:to-sky-900/40 border-l-4 border-cyan-400 dark:border-cyan-600`;
			case 'important':
				return `${baseClass} bg-gradient-to-br from-rose-50 via-rose-100 to-pink-100 dark:from-rose-950/50 dark:via-rose-900/40 dark:to-pink-900/40 border-l-4 border-rose-400 dark:border-rose-600`;
			case 'done':
				return `${baseClass} bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 dark:from-emerald-950/50 dark:via-emerald-900/40 dark:to-green-900/40 border-l-4 border-emerald-400 dark:border-emerald-600`;
			default:
				// Slightly adjusted default gradient
				return `${baseClass} bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-slate-800/40 border-l-4 border-gray-400 dark:border-gray-600`;
		}
	}

	// Get tag color for text and icons - Adjusted for better contrast (WCAG AA+)
	const getTagColor = (tag) => {
		switch (tag) {
			// Using darker shades for light mode, lighter for dark mode
			case 'pending': return 'text-blue-700 dark:text-blue-300';
			case 'attention': return 'text-amber-700 dark:text-amber-300';
			case 'general': return 'text-cyan-700 dark:text-cyan-300';
			case 'important': return 'text-rose-700 dark:text-rose-300';
			case 'done': return 'text-emerald-700 dark:text-emerald-300';
			default: return 'text-gray-700 dark:text-gray-300'; // Improved default contrast
		}
	}

	// Toggle dark mode
	const toggleDarkMode = () => {
		isDarkMode.value = !isDarkMode.value;
	}
</script>


<template>
	<div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-all duration-300">
		<!-- Added fade transition for loader -->
		<Transition name="fade">
			<scale-loader v-if="loading" color="#4f46e5" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
		</Transition>
		
		<!-- Improved conta0iner padding -->
		<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
			<div class="flex gap-4 md:gap-6 relative sm:h-[calc(100vh_-_120px)] min-h-0">
				<!-- Overlay for mobile sidebar with fade transition -->
				<Transition name="fade">
					<div
						v-if="isShowNoteMenu"
						class="bg-black/60 z-10 w-full h-full rounded-md absolute xl:hidden"
						@click="isShowNoteMenu = !isShowNoteMenu"
					></div>
				</Transition>
				
				<!-- Sidebar with slide transition -->
				<Transition name="slide-x">
					<div
						v-if="isShowNoteMenu || window.innerWidth >= 1280"
						class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 card-modern p-4 flex-none w-[280px] absolute xl:relative z-30 space-y-4 h-full xl:h-auto overflow-hidden shadow-lg xl:shadow-none transition-all duration-300 transform"
					>
					<div class="flex flex-col h-full pb-16">
						<!-- Header -->
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center">
								<font-awesome-icon icon="sticky-note" class="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
								<h3 class="text-xl font-bold ml-3 rtl:mr-3 text-gray-900 dark:text-white">Notes</h3>
							</div>
							<button
								@click="toggleDarkMode"
								class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
								:title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
							>
								<svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
								<svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
								</svg>
							</button>
						</div>
						
						<!-- Search Box -->
						<div class="relative mb-6">
							<input
								type="text"
								v-model="searchQuery"
								placeholder="Search notes..."
								class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
							/>
							<div class="absolute left-3 top-2.5 text-gray-400">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
						</div>
						
						<!-- Stats Card -->
						<div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-6">
							<h4 class="text-sm font-semibold text-indigo-800 dark:text-indigo-300 flex items-center mb-3">
								<font-awesome-icon icon="chart-line" class="mr-2" />
								Notes Statistics
							</h4>
							<div class="grid grid-cols-2 gap-2 text-xs">
								<div class="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm">
									<div class="text-gray-500 dark:text-gray-400">Total</div>
									<div class="text-lg font-bold text-gray-800 dark:text-white">{{ notesStats.total }}</div>
								</div>
								<div class="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm">
									<div class="text-gray-500 dark:text-gray-400">Favorites</div>
									<div class="text-lg font-bold text-amber-500">{{ notesStats.favorites }}</div>
								</div>
							</div>
						</div>
						
						<div class="h-px w-full border-b border-gray-200 dark:border-gray-700 mb-4"></div>
									<perfect-scrollbar
											:options="{
													swipeEasing: true,
													wheelPropagation: false,
											}"
											class="relative pr-3.5 -mr-3.5 h-full grow"
									>
											<div class="space-y-2">
												<button
													type="button"
													class="w-full flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
													:class="{ 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300': selectedTab === 'all' }"
													@click="tabChanged('all')"
												>
													<div class="flex items-center">
														<font-awesome-icon icon="sticky-note" class="w-5 h-5" />
														<div class="ml-3 rtl:mr-3">All Notes</div>
													</div>
													<span class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
														{{ notesStats.total }}
													</span>
												</button>
												<button
													type="button"
													class="w-full flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
													:class="{ 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300': selectedTab === 'fav' }"
													@click="tabChanged('fav')"
												>
													<div class="flex items-center">
														<font-awesome-icon icon="star" class="w-5 h-5 text-amber-500" />
														<div class="ml-3 rtl:mr-3">Favorites</div>
													</div>
													<span class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
														{{ notesStats.favorites }}
													</span>
												</button>
													<div class="h-px w-full border-b border-gray-200 dark:border-gray-700 my-4"></div>
													<div class="px-1 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center">
														<font-awesome-icon icon="tag" class="mr-2" />
														Tags
													</div>
													<button
														type="button"
														class="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
														:class="{ 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300': selectedTab === 'pending' }"
														@click="tabChanged('pending')"
													>
														<span class="w-3 h-3 rounded-full bg-blue-500 mr-3 rtl:ml-3"></span>
														Pending
														<span v-if="notesStats.tags.pending" class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
															{{ notesStats.tags.pending }}
														</span>
													</button>
													<button
														type="button"
														class="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
														:class="{ 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300': selectedTab === 'attention' }"
														@click="tabChanged('attention')"
													>
														<span class="w-3 h-3 rounded-full bg-amber-500 mr-3 rtl:ml-3"></span>
														Need Attention
														<span v-if="notesStats.tags.attention" class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
															{{ notesStats.tags.attention }}
														</span>
													</button>
													<button
														type="button"
														class="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
														:class="{ 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300': selectedTab === 'general' }"
														@click="tabChanged('general')"
													>
														<span class="w-3 h-3 rounded-full bg-cyan-500 mr-3 rtl:ml-3"></span>
														General
														<span v-if="notesStats.tags.general" class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
															{{ notesStats.tags.general }}
														</span>
													</button>
													<button
														type="button"
														class="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
														:class="{ 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300': selectedTab === 'done' }"
														@click="tabChanged('done')"
													>
														<span class="w-3 h-3 rounded-full bg-emerald-500 mr-3 rtl:ml-3"></span>
														Done
														<span v-if="notesStats.tags.done" class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
															{{ notesStats.tags.done }}
														</span>
													</button>
													<button
														type="button"
														class="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 font-medium"
														:class="{ 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300': selectedTab === 'important' }"
														@click="tabChanged('important')"
													>
														<span class="w-3 h-3 rounded-full bg-rose-500 mr-3 rtl:ml-3"></span>
														Important
														<span v-if="notesStats.tags.important" class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
															{{ notesStats.tags.important }}
														</span>
													</button>
											</div>
									</perfect-scrollbar>
							</div>
							<div class="left-0 rtl:right-0 absolute bottom-0 p-4 w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
								<button
									class="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
									type="button"
									@click="editNote()"
								>
									<font-awesome-icon icon="plus" class="w-4 h-4 mr-2 rtl:ml-2" />
									Add New Note
								</button>
							</div>

					</div>
				</Transition>
			<!-- Main Content Area -->
					<div class="flex-1 min-h-0 overflow-auto bg-transparent p-0">
						<div class="pb-5 flex justify-between items-center">
							<!-- Mobile Menu Toggle -->
							<button type="button" class="xl:hidden hover:text-indigo-600 dark:hover:text-indigo-400" @click="isShowNoteMenu = !isShowNoteMenu">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
									<path d="M20 7L4 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
									<path opacity="0.5" d="M20 12L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
									<path d="M20 17L4 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
								</svg>
							</button>
							<!-- Filter/View Options (Optional) -->
							<div class="flex items-center space-x-2">
								<!-- Add filter/view options here if needed -->
							</div>
						</div>
						
						<!-- No Notes Message -->
						<template v-if="!filterdNotesList.length">
							<div class="flex flex-col justify-center items-center sm:min-h-[300px] min-h-[400px] h-full text-center text-gray-500 dark:text-gray-400">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<h3 class="text-xl font-semibold mb-2">No notes found</h3>
								<p class="text-sm">Try adjusting your filters or add a new note.</p>
							</div>
						</template>
						
						<!-- Notes Grid -->
						<!-- Added fade transition for list -->
						<template v-if="filterdNotesList.length">
							<div class="sm:min-h-[300px] min-h-[400px]">
								<!-- Improved responsive grid with better spacing -->
								<div class="grid 2xl:grid-cols-4 xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 md:gap-6 transition-all duration-300">
									<TransitionGroup
										name="note-list"
										tag="div"
										class="contents"
										appear
									>
										<template v-for="note in filterdNotesList" :key="note.id">
										<!-- Modern Note Card - Adjusted Padding and added focus styles -->
										<div
											tabindex="0"
											class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
											:class="getCardClass(note)"
											:aria-labelledby="'note-title-' + note.id"
											:aria-describedby="'note-desc-' + note.id"
										>
											<!-- Adjusted padding (p-4) and added space-y-3 -->
											<div class="p-4 flex flex-col h-full space-y-3">
												<!-- Card Header - Removed mb-3 (using space-y now) -->
												<div class="flex justify-between items-start">
													<div class="flex items-center">
														<!-- User Avatar/Initial - Adjusted margin -->
														<div class="flex-none mr-3">
																									<div v-if="note.thumb" class="p-0.5 bg-gray-300 dark:bg-gray-700 rounded-full">
																											<img class="h-8 w-8 rounded-full object-cover" :src="`/assets/images/${note.thumb}`" />
																									</div>
																									<div
																											v-if="!note.thumb && note.user"
																											class="grid place-content-center h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 text-sm font-semibold"
																									>
																											{{ note.user.charAt(0) + '' + note.user.charAt(note.user.indexOf('') + 1) }}
																									</div>
																									<div
																											v-if="!note.thumb && !note.user"
																											class="bg-gray-300 dark:bg-gray-700 rounded-full grid place-content-center h-8 w-8"
																									>
																											<svg
																													width="24"
																													height="24"
																													viewBox="0 0 24 24"
																													fill="none"
																													xmlns="http://www.w3.org/2000/svg"
																													class="w-4.5 h-4.5"
																											>
																													<circle cx="12" cy="6" r="4" stroke="currentColor" stroke-width="1.5"></circle>
																													<ellipse
																															opacity="0.5"
																															cx="12"
																															cy="17"
																															rx="7"
																															ry="4"
																															stroke="currentColor"
																															stroke-width="1.5"
																													></ellipse>
																											</svg>
																									</div>
																							</div>
																							<div class="ml-2 rtl:mr-2">
																									<!-- Improved contrast for user name -->
																									<div class="font-semibold text-gray-800 dark:text-gray-100">{{ note.user }}</div>
																									<!-- Improved contrast for date -->
																									<div class="font-nunito text-sm text-gray-600 dark:text-gray-400">{{ moment(note.date).format('ddd, DD MMMM YYYY') }}</div>
																							</div>
																					</div>
																					<div class="dropdown">
																							<Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0">
																									<!-- Added aria-label and improved focus style -->
																									<button
																										type="button"
																										class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
																										aria-label="Note options"
																									>
																											<svg
																													width="24"
																													height="24"
																													viewBox="0 0 24 24"
																													fill="none"
																													xmlns="http://www.w3.org/2000/svg"
																													class="w-5 h-5 rotate-90" 
																											>
																													<circle cx="5" cy="12" r="2" stroke="currentColor" stroke-width="1.5"></circle>
																													<circle opacity="0.7" cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"></circle> <!-- Adjusted opacity -->
																													<circle cx="19" cy="12" r="2" stroke="currentColor" stroke-width="1.5"></circle>
																											</svg>
																									</button>
																									<template #content="{ close }">
																											<ul @click="close()" class="text-sm font-medium">
																													<li>
																															<a href="javascript:;" class="w-full" @click="editNote(note)">
																																	<svg
																																			width="24"
																																			height="24"
																																			viewBox="0 0 24 24"
																																			fill="none"
																																			xmlns="http://www.w3.org/2000/svg"
																																			class="w-4 h-4 mr-3 rtl:ml-3"
																																	>
																																			<path
																																					d="M15.2869 3.15178L14.3601 4.07866L5.83882 12.5999L5.83881 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021L2.05445 20.6042C1.92743 20.9852 2.0266 21.4053 2.31063 21.6894C2.59466 21.9734 3.01478 22.0726 3.39584 21.9456L4.19792 21.6782L7.47918 20.5844L7.47919 20.5844C8.25353 20.3263 8.6407 20.1973 9.00498 20.0237C9.43469 19.8189 9.84082 19.5679 10.2162 19.2751C10.5344 19.0269 10.8229 18.7383 11.4001 18.1612L11.4001 18.1612L19.9213 9.63993L20.8482 8.71306C22.3839 7.17735 22.3839 4.68748 20.8482 3.15178C19.3125 1.61607 16.8226 1.61607 15.2869 3.15178Z"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																			/>
																																			<path
																																					opacity="0.5"
																																					d="M14.36 4.07812C14.36 4.07812 14.4759 6.04774 16.2138 7.78564C17.9517 9.52354 19.9213 9.6394 19.9213 9.6394M4.19789 21.6777L2.32178 19.8015"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																			/>
																																	</svg>

																																	Edit
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" class="w-full" @click="deleteNoteConfirm(note)">
																																	<svg
																																			width="24"
																																			height="24"
																																			viewBox="0 0 24 24"
																																			fill="none"
																																			xmlns="http://www.w3.org/2000/svg"
																																			class="w-4.5 h-4.5 mr-3 rtl:ml-3"
																																	>
																																			<path
																																					d="M20.5001 6H3.5"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																					stroke-linecap="round"
																																			></path>
																																			<path
																																					d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																					stroke-linecap="round"
																																			></path>
																																			<path
																																					opacity="0.5"
																																					d="M9.5 11L10 16"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																					stroke-linecap="round"
																																			></path>
																																			<path
																																					opacity="0.5"
																																					d="M14.5 11L14 16"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																					stroke-linecap="round"
																																			></path>
																																			<path
																																					opacity="0.5"
																																					d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																			></path>
																																	</svg>
																																	Delete
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" class="w-full" @click="viewNote(note)">
																																	<svg
																																			width="24"
																																			height="24"
																																			viewBox="0 0 24 24"
																																			fill="none"
																																			xmlns="http://www.w3.org/2000/svg"
																																			class="w-4.5 h-4.5 mr-3 rtl:ml-3"
																																	>
																																			<path
																																					opacity="0.5"
																																					d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																			/>
																																			<path
																																					d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
																																					stroke="currentColor"
																																					stroke-width="1.5"
																																			/>
																																	</svg>

																																	View
																															</a>
																													</li>
																											</ul>
																									</template>
																							</Popper>
																					</div>
																			</div>
																			<!-- Card Body - Removed mt-4 (using space-y now) -->
																			<div class="flex-grow">
																					<!-- Added ID for aria-labelledby -->
																					<h4 :id="'note-title-' + note.id" class="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-100">{{ note.title }}</h4>
																					<!-- Added ID for aria-describedby, improved contrast, line-clamp -->
																					<p :id="'note-desc-' + note.id" class="font-nunito text-sm text-gray-600 dark:text-gray-300 line-clamp-3" v-html="note.description"></p>
																			</div>
																	</div>
																	<!-- Card Footer - Adjusted positioning and padding -->
																	<div class="pt-3 mt-auto">
																			<!-- Removed border-b, adjusted text contrast -->
																			<div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
																				<span><!-- Placeholder if needed --></span>
																				<span>by: {{ note.author || 'Unknown' }}</span> <!-- Added fallback -->
																			</div>
																			<!-- Adjusted margin-top -->
																			<div class="flex items-center justify-between mt-3">
																					<div class="dropdown">
																							<Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0">
																									<!-- Tag Indicator Button - Added aria-label and improved styling/contrast -->
																									<button
																											type="button"
																											:class="getTagColor(note.tag)"
																											class="flex items-center space-x-1 text-xs font-medium p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
																											:aria-label="'Current tag: ' + (note.tag || 'None') + '. Change tag.'"
																									>
																											<!-- Using background color for the dot for better visibility -->
																											<span class="w-2.5 h-2.5 rounded-full inline-block" :class="{
																												'bg-blue-500': note.tag === 'pending',
																												'bg-amber-500': note.tag === 'attention',
																												'bg-cyan-500': note.tag === 'general',
																												'bg-emerald-500': note.tag === 'done',
																												'bg-rose-500': note.tag === 'important',
																												'bg-gray-500': !note.tag
																											}"></span>
																											<span class="capitalize">{{ note.tag || 'None' }}</span>
																									</button>
																									<template #content="{ close }">
																											<ul @click="close()">
																													<!-- Dropdown items - simplified, using background dots -->
																													<li>
																															<a href="javascript:;" @click="setTag(note, 'pending')" class="flex items-center">
																																	<span class="w-2.5 h-2.5 rounded-full inline-block mr-2 rtl:ml-2 bg-blue-500"></span>
																																	Pending
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" @click="setTag(note, 'attention')" class="flex items-center">
																																	<span class="w-2.5 h-2.5 rounded-full inline-block mr-2 rtl:ml-2 bg-amber-500"></span>
																																	Attention
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" @click="setTag(note, 'general')" class="flex items-center">
																																	<span class="w-2.5 h-2.5 rounded-full inline-block mr-2 rtl:ml-2 bg-cyan-500"></span>
																																	General
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" @click="setTag(note, 'done')" class="flex items-center">
																																	<span class="w-2.5 h-2.5 rounded-full inline-block mr-2 rtl:ml-2 bg-emerald-500"></span>
																																	Done
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" @click="setTag(note, 'important')" class="flex items-center">
																																	<span class="w-2.5 h-2.5 rounded-full inline-block mr-2 rtl:ml-2 bg-rose-500"></span>
																																	Important
																															</a>
																													</li>
																													<li>
																															<a href="javascript:;" @click="setTag(note, '')" class="flex items-center">
																																	<span class="w-2.5 h-2.5 rounded-full inline-block mr-2 rtl:ml-2 bg-gray-500"></span>
																																	None
																															</a>
																													</li>
																											</ul>
																									</template>
																							</Popper>
																					</div>
																					<!-- Action Buttons - Added spacing, aria-labels, improved focus -->
																					<div class="flex items-center space-x-1">
																							<!-- Delete Button -->
																							<button
																								type="button"
																								class="text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-500 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
																								@click="deleteNoteConfirm(note)"
																								aria-label="Delete note"
																							>
																									<font-awesome-icon icon="trash" class="w-4 h-4" />
																							</button>
																							<!-- Favorite Button -->
																							<button
																								type="button"
																								class="text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 group"
																								@click="setFav(note)"
																								:aria-label="note.isFav ? 'Remove from favorites' : 'Add to favorites'"
																								:aria-pressed="note.isFav"
																							>
																									<font-awesome-icon
																										icon="star"
																										class="w-4 h-4 transition-colors"
																										:class="{ 'text-amber-500 dark:text-amber-400': note.isFav }"
																									/>
																							</button>
																					</div>
																			</div>
																	</div>
															</div>
													</template>
												</TransitionGroup>
											</div>
									</div>
							</template>

							<TransitionRoot appear :show="isAddNoteModal" as="template">
									<Dialog as="div" @close="isAddNoteModal = false" class="relative z-50">
											<TransitionChild
													as="template"
													enter="duration-300 ease-out"
													enter-from="opacity-0"
													enter-to="opacity-100"
													leave="duration-200 ease-in"
													leave-from="opacity-100"
													leave-to="opacity-0"
											>
													<DialogOverlay class="fixed inset-0 bg-[black]/60" />
											</TransitionChild>

											<div class="fixed inset-0 overflow-y-auto">
													<div class="flex min-h-full items-center justify-center px-4 py-8">
															<TransitionChild
																	as="template"
																	enter="duration-300 ease-out"
																	enter-from="opacity-0 scale-95"
																	enter-to="opacity-100 scale-100"
																	leave="duration-200 ease-in"
																	leave-from="opacity-100 scale-100"
																	leave-to="opacity-0 scale-95"
															>
																	<DialogPanel class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white">
																			<button
																					type="button"
																					class="absolute top-4 right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
																					@click="isAddNoteModal = false"
																			>
																					<svg
																							xmlns="http://www.w3.org/2000/svg"
																							width="24px"
																							height="24px"
																							viewBox="0 0 24 24"
																							fill="none"
																							stroke="currentColor"
																							stroke-width="1.5"
																							stroke-linecap="round"
																							stroke-linejoin="round"
																							class="w-6 h-6"
																					>
																							<line x1="18" y1="6" x2="6" y2="18"></line>
																							<line x1="6" y1="6" x2="18" y2="18"></line>
																					</svg>
																			</button>
																			<div class="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] pl-5 rtl:pr-5 py-3 pr-[50px] rtl:pl-[50px]">
																					{{ params.id ? 'Edit Note' : 'Add Note' }}
																			</div>
																			<div class="p-5">
																					<form @submit.prevent="saveNote">
																							<div class="mb-5">
																									<label for="title">Title</label>
																									<input id="title" type="text" placeholder="Enter Title" class="form-input" v-model="params.title" />
																							</div>
																							<div class="mb-5">
																									<label for="name">Contact</label>
																									<select id="name" class="form-select" v-model="params.userId">
																											<option value="">Select User</option>
																											<option v-for="user in users" :value="user.id">{{ user.name }}</option>
																									</select>
																							</div>
																							<div class="mb-5">
																									<label for="tag">Tag</label>
																									<select id="tag" class="form-select" v-model="params.tag">
																											<option value="">None</option>
																											<option value="pending">Pending</option>
																											<option value="attention">Need Attention</option>
																											<option value="general">General</option>
																											<option value="done">Done</option>
																											<option value="important">Important</option>
																									</select>
																							</div>
																							<div class="mb-5">
																									<label for="desc">Description</label>
																									<textarea
																											id="desc"
																											rows="3"
																											class="form-textarea resize-none min-h-[130px]"
																											placeholder="Enter Description"
																											v-model="params.description"
																									></textarea>
																							</div>
																							<div class="flex justify-end items-center mt-8">
																									<button type="button" class="btn btn-outline-danger gap-2" @click="isAddNoteModal = false">Cancel</button>
																									<button type="submit" class="btn btn-primary ml-4 rtl:mr-4">
																											{{ params.id ? 'Update Note' : 'Add Note' }}
																									</button>
																							</div>
																					</form>
																			</div>
																	</DialogPanel>
															</TransitionChild>
													</div>
											</div>
									</Dialog>
							</TransitionRoot>

							<TransitionRoot appear :show="isDeleteNoteModal" as="template">
									<Dialog as="div" @close="isDeleteNoteModal = false" class="relative z-50">
											<TransitionChild
													as="template"
													enter="duration-300 ease-out"
													enter-from="opacity-0"
													enter-to="opacity-100"
													leave="duration-200 ease-in"
													leave-from="opacity-100"
													leave-to="opacity-0"
											>
													<DialogOverlay class="fixed inset-0 bg-[black]/60" />
											</TransitionChild>

											<div class="fixed inset-0 overflow-y-auto">
													<div class="flex min-h-full items-center justify-center px-4 py-8">
															<TransitionChild
																	as="template"
																	enter="duration-300 ease-out"
																	enter-from="opacity-0 scale-95"
																	enter-to="opacity-100 scale-100"
																	leave="duration-200 ease-in"
																	leave-from="opacity-100 scale-100"
																	leave-to="opacity-0 scale-95"
															>
																	<DialogPanel class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white">
																			<button
																					type="button"
																					class="absolute top-4 right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
																					@click="isDeleteNoteModal = false"
																			>
																					<svg
																							xmlns="http://www.w3.org/2000/svg"
																							width="24px"
																							height="24px"
																							viewBox="0 0 24 24"
																							fill="none"
																							stroke="currentColor"
																							stroke-width="1.5"
																							stroke-linecap="round"
																							stroke-linejoin="round"
																							class="w-6 h-6"
																					>
																							<line x1="18" y1="6" x2="6" y2="18"></line>
																							<line x1="6" y1="6" x2="18" y2="18"></line>
																					</svg>
																			</button>
																			<div class="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] pl-5 rtl:pr-5 py-3 pr-[50px] rtl:pl-[50px]">
																					Delete Notes
																			</div>
																			<div class="p-5 text-center">
																					<div class="bg-danger ring-4 ring-danger/30 p-4 rounded-full w-fit mx-auto">
																							<svg
																									width="24"
																									height="24"
																									viewBox="0 0 24 24"
																									fill="none"
																									xmlns="http://www.w3.org/2000/svg"
																									class="w-7 h-7 mx-auto"
																							>
																									<path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
																									<path
																											d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5"
																											stroke="currentColor"
																											stroke-width="1.5"
																											stroke-linecap="round"
																									></path>
																									<path
																											opacity="0.5"
																											d="M9.5 11L10 16"
																											stroke="currentColor"
																											stroke-width="1.5"
																											stroke-linecap="round"
																									></path>
																									<path
																											opacity="0.5"
																											d="M14.5 11L14 16"
																											stroke="currentColor"
																											stroke-width="1.5"
																											stroke-linecap="round"
																									></path>
																									<path
																											opacity="0.5"
																											d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6"
																											stroke="currentColor"
																											stroke-width="1.5"
																									></path>
																							</svg>
																					</div>
																					<div class="sm:w-3/4 mx-auto mt-5">Are you sure you want to delete Notes?</div>

																					<div class="flex justify-center items-center mt-8">
																							<button type="button" class="btn btn-outline-danger" @click="isDeleteNoteModal = false">Cancel</button>
																							<button type="button" class="btn btn-primary ml-4 rtl:mr-4" @click="deleteNote">Delete</button>
																					</div>
																			</div>
																	</DialogPanel>
															</TransitionChild>
													</div>
											</div>
									</Dialog>
							</TransitionRoot>

							<TransitionRoot appear :show="isViewNoteModal" as="template">
									<Dialog as="div" @close="isViewNoteModal = false" class="relative z-50">
											<TransitionChild
													as="template"
													enter="duration-300 ease-out"
													enter-from="opacity-0"
													enter-to="opacity-100"
													leave="duration-200 ease-in"
													leave-from="opacity-100"
													leave-to="opacity-0"
											>
													<DialogOverlay class="fixed inset-0 bg-[black]/60" />
											</TransitionChild>

											<div class="fixed inset-0 overflow-y-auto">
													<div class="flex min-h-full items-center justify-center px-4 py-8">
															<TransitionChild
																	as="template"
																	enter="duration-300 ease-out"
																	enter-from="opacity-0 scale-95"
																	enter-to="opacity-100 scale-100"
																	leave="duration-200 ease-in"
																	leave-from="opacity-100 scale-100"
																	leave-to="opacity-0 scale-95"
															>
																	<DialogPanel class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white">
																			<button
																					type="button"
																					class="absolute top-4 right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
																					@click="isViewNoteModal = false"
																			>
																					<svg
																							xmlns="http://www.w3.org/2000/svg"
																							width="24px"
																							height="24px"
																							viewBox="0 0 24 24"
																							fill="none"
																							stroke="currentColor"
																							stroke-width="1.5"
																							stroke-linecap="round"
																							stroke-linejoin="round"
																							class="w-6 h-6"
																					>
																							<line x1="18" y1="6" x2="6" y2="18"></line>
																							<line x1="6" y1="6" x2="18" y2="18"></line>
																					</svg>
																			</button>
																			<div
																					class="flex items-center flex-wrap gap-2 text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] pl-5 rtl:pr-5 py-3 pr-[50px] rtl:pl-[50px]"
																			>
																					<div class="mr-3 rtl:ml-3">{{ selectedNote.title }}</div>
																					<button
																							v-show="selectedNote.tag"
																							type="button"
																							class="badge badge-outline-primary rounded-3xl capitalize mr-3 rtl:ml-3"
																							:class="{
																									'shadow-primary': selectedNote.tag === 'pending',
																									'shadow-warning': selectedNote.tag === 'attention',
																									'shadow-info': selectedNote.tag === 'general',
																									'shadow-success': selectedNote.tag === 'done',
																									'shadow-danger': selectedNote.tag === 'important',
																							}"
																					>
																							{{ selectedNote.tag }}
																					</button>
																					<button v-show="selectedNote.isFav" type="button" class="text-warning">
																							<svg
																									width="18"
																									height="18"
																									viewBox="0 0 24 24"
																									fill="none"
																									xmlns="http://www.w3.org/2000/svg"
																									class="fill-warning"
																							>
																									<path
																											d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
																											stroke="currentColor"
																											stroke-width="1.5"
																									></path>
																							</svg>
																					</button>
																			</div>
																			<div class="p-5">
																					<div class="text-base" v-html="selectedNote.description"></div>

																					<div class="text-right rtl:text-left mt-8">
																							<button type="button" class="btn btn-outline-danger" @click="isViewNoteModal = false">Close</button>
																					</div>
																			</div>
																	</DialogPanel>
															</TransitionChild>
													</div>
											</div>
									</Dialog>
							</TransitionRoot>
						</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Base transitions */
.transition-all {
	 transition-property: all;
	 transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	 transition-duration: 300ms;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
	 transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	 opacity: 0;
}

/* Slide transition for sidebar */
.slide-x-enter-active,
.slide-x-leave-active {
	 transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-x-enter-from,
.slide-x-leave-to {
	 transform: translateX(-100%);
}

/* Note list transitions */
.note-list-move,
.note-list-enter-active,
.note-list-leave-active {
	 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.note-list-enter-from,
.note-list-leave-to {
	 opacity: 0;
	 transform: translateY(30px);
}

.note-list-leave-active {
	 position: absolute;
}

/* Loading transition */
.vld-overlay {
	 transition: opacity 0.3s ease;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
	 transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
	 opacity: 0;
	 transform: scale(0.95);
}

/* Button hover transitions */
button {
	 transition: all 0.2s ease;
}

/* Form input transitions */
.form-input,
.form-select,
.form-textarea {
	 transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Tag transitions */
.badge {
	 transition: all 0.2s ease;
}

/* Card hover effect */
.note-card {
	 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.note-card:hover {
	 transform: translateY(-2px);
}

/* Dark mode transition */
.dark {
	 transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
