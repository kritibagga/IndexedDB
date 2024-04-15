import "./App.css";
import { useEffect, useState } from "react";
import { USER_DATA } from "./data";

const idb =
	window.indexedDB ||
	window.mozIndexedDB ||
	window.webkitIndexedDB ||
	window.msIndexedDB ||
	window.shimIndexedDB;

const insertDataintoDB = () => {
	if (!idb) {
		console.log("This browser doesn't support IndexedDB");
		return;
	}

	const request = idb.open("user-db", 2);
	request.onerror = (e) => {
		console.log("Error", e);
		console.log("An Error occurred with indexedDB");
	};
	request.onupgradeneeded = (e) => {
		const db = request.result;
		console.log(e);

		if (!db.objectStoreNames.contains("userData")) {
			db.createObjectStore("userData", { keyPath: "id" });
		}
	};

	request.onsuccess = () => {
		console.log("Database opened successfully");
		const db = request.result;
		let tx = db.transaction("userData", "readwrite");
		let userData = tx.objectStore("userData");
		USER_DATA.forEach((item) => {
			userData.add(item);
		});
		return tx.complete;
	};
};

const App = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [editUser, setEditUser] = useState(false);
	const [addUser, setAddUser] = useState(false);
	const [allUsers, setAllUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState({});

	useEffect(() => {
		insertDataintoDB();
		getAllData();
	}, []);

	const getAllData = () => {
		const dbPromise = idb.open("user-db", 2);
		dbPromise.onsuccess = () => {
			const db = dbPromise.result;

			var tx = db.transaction("userData", "readonly");
			var userData = tx.objectStore("userData");
			const users = userData.getAll();

			users.onsuccess = (query) => {
				setAllUsers(query.srcElement.result);
			};

			tx.oncomplete = function () {
				db.close();
			};
		};
	};

	const deleteUser = (user) => {
		const dbPromise = idb.open("user-db", 2);
		dbPromise.onsuccess = () => {
			const db = dbPromise.result;

			var tx = db.transaction("userData", "readwrite");
			var userData = tx.objectStore("userData");
			const deleteUser = userData.delete(user.id);
			deleteUser.onsuccess = (query) => {
				tx.oncomplete = function () {
					db.close();
				};
				alert("User Deleted");
				getAllData();
			};
		};
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const dbPromise = idb.open("user-db", 2);

		if (firstName && lastName && email) {
			dbPromise.onsuccess = () => {
				const db = dbPromise.result;
				const tx = db.transaction("userData", "readwrite");
				let userData = tx.objectStore("userData");

				if (addUser) {
					const users = userData.put({
						id: allUsers?.length + 1,
						firstName,
						lastName,
						email,
					});
					users.onsuccess = (query) => {
						tx.oncomplete = function () {
							db.close();
						};
						alert("User updated!");
						setFirstName("");
						setLastName("");
						setEmail("");

						setAddUser(false);
						getAllData();
						setSelectedUser({});
					};
				} else {
					const users = userData.put({
						id: selectedUser?.id,
						firstName,
						lastName,
						email,
					});
					console.log("edit");

					users.onsuccess = (query) => {
						tx.oncomplete = function () {
							db.close();
						};
						alert("User updated!");
						setFirstName("");
						setLastName("");
						setEmail("");

						setEditUser(false);
						getAllData();
						setSelectedUser({});
						e.preventDefault();
					};
				}
			};
		}
	};
	return (
		<div className='App'>
			<button
				type='button'
				className='btn btn-primary add-btn'
				onClick={() => {
					setFirstName("");
					setLastName("");
					setEmail("");
					setEditUser(false);
					setAddUser(true);
				}}>
				Add Data
			</button>

			<table className='table table-striped table-bordered'>
				<thead>
					<tr>
						<th>FirstName</th>
						<th>LastName</th>
						<th>Email</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{allUsers?.map((user) => {
						return (
							<tr key={user?.id}>
								<td>{user.firstName}</td>
								<td>{user.lastName}</td>
								<td>{user.email}</td>
								<td>
									<button
										className='btn btn-primary'
										onClick={() => {
											setEditUser(true);
											// setAddUser(false);

											setSelectedUser(user);
											setEmail(user?.email);
											setFirstName(user?.firstName);
											setLastName(user?.lastName);
										}}>
										Edit
									</button>
									<button
										className='btn btn-danger'
										onClick={() => {
											deleteUser(user);
										}}>
										Delete
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{editUser || addUser ? (
				<>
					<h3>{editUser ? "Edit User" : "Add User"}</h3>
					<form className='form'>
						<div className='mb-3'>
							<label
								htmlFor='firstnameinput'
								className='form-label'>
								FirstName
							</label>
							<input
								type='text'
								className='form-control'
								id='firstnameinput'
								onChange={(e) => setFirstName(e.target.value)}
								value={firstName}
							/>
						</div>
						<div className='mb-3'>
							<label
								htmlFor='lname'
								className='form-label'>
								LastName
							</label>
							<input
								type='text'
								className='form-control'
								id='lname'
								onChange={(e) => setLastName(e.target.value)}
								value={lastName}
							/>
						</div>

						<div className='mb-3'>
							<label
								htmlFor='emailinput'
								className='form-label'>
								Email
							</label>
							<input
								type='email'
								className='form-control'
								id='emailinput'
								onChange={(e) => setEmail(e.target.value)}
								value={email}
							/>
						</div>

						<button
							type='submit'
							className='btn btn-primary'
							onClick={handleSubmit}>
							{editUser ? "Update" : "Add"}
						</button>
					</form>
				</>
			) : null}
		</div>
	);
};

export default App;
