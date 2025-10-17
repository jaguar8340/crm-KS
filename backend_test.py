import requests
import sys
from datetime import datetime

class CRMAPITester:
    def __init__(self, base_url="https://easy-crm-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_ids = {
            "customer": None,
            "vehicle": None,
            "employee": None,
            "task": None,
            "user": None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers_override=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = headers_override if headers_override else {'Content-Type': 'application/json'}
        if self.token and not headers_override:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASSED", "code": response.status_code})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.test_results.append({"test": name, "status": "FAILED", "code": response.status_code, "expected": expected_status})

            try:
                return success, response.json() if response.text else {}
            except:
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "error": str(e)})
            return False, {}

    def test_login(self, username, password):
        """Test login and get token"""
        print("\n" + "="*60)
        print("TESTING AUTHENTICATION")
        print("="*60)
        
        success, response = self.run_test(
            "Login with admin credentials",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token received: {self.token[:20]}...")
            print(f"   User role: {response.get('user', {}).get('role')}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get current user info",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_customers(self):
        """Test customer CRUD operations"""
        print("\n" + "="*60)
        print("TESTING CUSTOMER MANAGEMENT")
        print("="*60)
        
        # Create customer
        customer_data = {
            "kunden_nr": "K001",
            "vorname": "Max",
            "name": "Mustermann",
            "firma": "Test GmbH",
            "strasse": "Teststrasse 1",
            "plz": "8000",
            "ort": "Zürich",
            "telefon_p": "+41 44 123 45 67",
            "telefon_g": "+41 44 123 45 68",
            "natel": "+41 79 123 45 67",
            "email_p": "max@test.com",
            "email_g": "max.work@test.com",
            "geburtsdatum": "1980-01-15"
        }
        
        success, response = self.run_test(
            "Create customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        if success and 'id' in response:
            self.created_ids['customer'] = response['id']
            print(f"   Customer ID: {self.created_ids['customer']}")
        
        # Get all customers
        success, response = self.run_test(
            "Get all customers",
            "GET",
            "customers",
            200
        )
        if success:
            print(f"   Total customers: {len(response)}")
        
        # Get specific customer
        if self.created_ids['customer']:
            success, response = self.run_test(
                "Get customer by ID",
                "GET",
                f"customers/{self.created_ids['customer']}",
                200
            )
        
        # Update customer
        if self.created_ids['customer']:
            customer_data['firma'] = "Updated GmbH"
            success, response = self.run_test(
                "Update customer",
                "PUT",
                f"customers/{self.created_ids['customer']}",
                200,
                data=customer_data
            )

    def test_vehicles(self):
        """Test vehicle CRUD operations"""
        print("\n" + "="*60)
        print("TESTING VEHICLE MANAGEMENT")
        print("="*60)
        
        if not self.created_ids['customer']:
            print("⚠️  Skipping vehicle tests - no customer created")
            return
        
        # Create vehicle
        vehicle_data = {
            "customer_id": self.created_ids['customer'],
            "marke": "BMW",
            "modell": "X5",
            "chassis_nr": "WBA12345678901234",
            "stamm_nr": "ST001",
            "typenschein_nr": "TS001",
            "farbe": "Schwarz",
            "inverkehrsetzung": "2020-05-15",
            "km_stand": "50000",
            "vista_nr": "V001",
            "verkaeufer": "Hans Müller",
            "kundenberater": "Peter Schmidt"
        }
        
        success, response = self.run_test(
            "Create vehicle",
            "POST",
            "vehicles",
            200,
            data=vehicle_data
        )
        if success and 'id' in response:
            self.created_ids['vehicle'] = response['id']
            print(f"   Vehicle ID: {self.created_ids['vehicle']}")
        
        # Get all vehicles
        success, response = self.run_test(
            "Get all vehicles",
            "GET",
            "vehicles",
            200
        )
        if success:
            print(f"   Total vehicles: {len(response)}")
        
        # Get vehicles by customer
        success, response = self.run_test(
            "Get vehicles by customer",
            "GET",
            f"vehicles?customer_id={self.created_ids['customer']}",
            200
        )
        if success:
            print(f"   Customer's vehicles: {len(response)}")
        
        # Get specific vehicle
        if self.created_ids['vehicle']:
            success, response = self.run_test(
                "Get vehicle by ID",
                "GET",
                f"vehicles/{self.created_ids['vehicle']}",
                200
            )
        
        # Update vehicle
        if self.created_ids['vehicle']:
            vehicle_data['km_stand'] = "55000"
            success, response = self.run_test(
                "Update vehicle",
                "PUT",
                f"vehicles/{self.created_ids['vehicle']}",
                200,
                data=vehicle_data
            )

    def test_employees(self):
        """Test employee CRUD operations"""
        print("\n" + "="*60)
        print("TESTING EMPLOYEE MANAGEMENT")
        print("="*60)
        
        # Create employee
        employee_data = {
            "vorname": "Anna",
            "name": "Schmidt",
            "strasse": "Bahnhofstrasse 10",
            "plz": "8001",
            "ort": "Zürich",
            "email": "anna.schmidt@test.com",
            "telefon": "+41 44 987 65 43",
            "eintritt_firma": "2015-03-01",
            "geburtstag": "1990-06-15"
        }
        
        success, response = self.run_test(
            "Create employee",
            "POST",
            "employees",
            200,
            data=employee_data
        )
        if success and 'id' in response:
            self.created_ids['employee'] = response['id']
            print(f"   Employee ID: {self.created_ids['employee']}")
        
        # Get all employees
        success, response = self.run_test(
            "Get all employees",
            "GET",
            "employees",
            200
        )
        if success:
            print(f"   Total employees: {len(response)}")
        
        # Get specific employee
        if self.created_ids['employee']:
            success, response = self.run_test(
                "Get employee by ID",
                "GET",
                f"employees/{self.created_ids['employee']}",
                200
            )
        
        # Update employee
        if self.created_ids['employee']:
            employee_data['telefon'] = "+41 44 987 65 44"
            success, response = self.run_test(
                "Update employee",
                "PUT",
                f"employees/{self.created_ids['employee']}",
                200,
                data=employee_data
            )

    def test_tasks(self):
        """Test task CRUD operations"""
        print("\n" + "="*60)
        print("TESTING TASK MANAGEMENT")
        print("="*60)
        
        if not self.created_ids['customer']:
            print("⚠️  Skipping task tests - no customer created")
            return
        
        # Create task
        task_data = {
            "customer_id": self.created_ids['customer'],
            "customer_name": "Max Mustermann",
            "datum_kontakt": "2025-01-15",
            "zeitpunkt_kontakt": "14:00",
            "bemerkungen": "Rückruf wegen Servicetermin",
            "telefon_nummer": "+41 79 123 45 67",
            "assigned_to": "admin-user-id",
            "assigned_to_name": "Admin User"
        }
        
        success, response = self.run_test(
            "Create task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        if success and 'id' in response:
            self.created_ids['task'] = response['id']
            print(f"   Task ID: {self.created_ids['task']}")
            print(f"   Task status: {response.get('status')}")
        
        # Get all tasks
        success, response = self.run_test(
            "Get all tasks",
            "GET",
            "tasks",
            200
        )
        if success:
            print(f"   Total tasks: {len(response)}")
        
        # Get my tasks
        success, response = self.run_test(
            "Get my tasks",
            "GET",
            "tasks/my",
            200
        )
        if success:
            print(f"   My tasks: {len(response)}")
        
        # Update task status
        if self.created_ids['task']:
            success, response = self.run_test(
                "Update task status to 'erledigt'",
                "PUT",
                f"tasks/{self.created_ids['task']}/status?status=erledigt",
                200
            )

    def test_users(self):
        """Test user management (admin only)"""
        print("\n" + "="*60)
        print("TESTING USER MANAGEMENT (ADMIN)")
        print("="*60)
        
        # Get all users
        success, response = self.run_test(
            "Get all users",
            "GET",
            "users",
            200
        )
        if success:
            print(f"   Total users: {len(response)}")
        
        # Create new user
        user_data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "name": "Test User",
            "password": "testpass123",
            "role": "user"
        }
        
        success, response = self.run_test(
            "Create new user",
            "POST",
            "users",
            200,
            data=user_data
        )
        if success and 'id' in response:
            self.created_ids['user'] = response['id']
            print(f"   User ID: {self.created_ids['user']}")

    def cleanup(self):
        """Delete created test data"""
        print("\n" + "="*60)
        print("CLEANUP - Deleting test data")
        print("="*60)
        
        # Delete in reverse order of dependencies
        if self.created_ids['task']:
            self.run_test("Delete task", "DELETE", f"tasks/{self.created_ids['task']}", 200)
        
        if self.created_ids['vehicle']:
            self.run_test("Delete vehicle", "DELETE", f"vehicles/{self.created_ids['vehicle']}", 200)
        
        if self.created_ids['employee']:
            self.run_test("Delete employee", "DELETE", f"employees/{self.created_ids['employee']}", 200)
        
        if self.created_ids['customer']:
            self.run_test("Delete customer", "DELETE", f"customers/{self.created_ids['customer']}", 200)
        
        if self.created_ids['user']:
            self.run_test("Delete user", "DELETE", f"users/{self.created_ids['user']}", 200)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"✅ Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        failed_tests = [t for t in self.test_results if t['status'] in ['FAILED', 'ERROR']]
        if failed_tests:
            print(f"\n❌ Failed tests ({len(failed_tests)}):")
            for test in failed_tests:
                error_msg = test.get('error', f"Status {test.get('code')} (expected {test.get('expected')})")
                print(f"   - {test['test']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    # Setup
    tester = CRMAPITester()
    
    print("="*60)
    print("CRM SYSTEM - BACKEND API TESTING")
    print("="*60)
    print(f"Base URL: {tester.base_url}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run tests
    if not tester.test_login("admin", "admin123"):
        print("\n❌ Login failed, stopping tests")
        return 1
    
    tester.test_get_me()
    tester.test_customers()
    tester.test_vehicles()
    tester.test_employees()
    tester.test_tasks()
    tester.test_users()
    
    # Cleanup
    tester.cleanup()
    
    # Print results
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
