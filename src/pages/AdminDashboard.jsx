import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Search, LogOut, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialDepartments = [
  { id: 1, name: "Information Technology", abbreviation: "IT", password: "it123" },
  { id: 2, name: "Mechanical Engineering", abbreviation: "MECH", password: "mech123" },
  { id: 3, name: "Civil Engineering", abbreviation: "CIVIL", password: "civil123" },
  { id: 4, name: "Electrical Engineering", abbreviation: "EE", password: "ee123" },
  { id: 5, name: "Electronics and Communication", abbreviation: "ECE", password: "ece123" },
];

const AdminDashboard = () => {
  const [departments, setDepartments] = useState(initialDepartments);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptAbbr, setNewDeptAbbr] = useState("");
  const [deptPassword, setDeptPassword] = useState("");
  const [newDeptPassword, setNewDeptPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a department name",
        variant: "destructive",
      });
      return;
    }

    if (!newDeptPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a department password",
        variant: "destructive",
      });
      return;
    }

    const newDept = {
      id: Date.now(),
      name: newDeptName.trim(),
      abbreviation: newDeptAbbr.trim() || newDeptName.substring(0, 3).toUpperCase(),
      password: newDeptPassword.trim(),
    };

    setDepartments([...departments, newDept]);
    setNewDeptName("");
    setNewDeptAbbr("");
    setNewDeptPassword("");
    setShowAddDialog(false);

    toast({
      title: "Success",
      description: `${newDept.name} department added successfully`,
    });
  };

  const handleDepartmentClick = (dept) => {
    setSelectedDepartment(dept);
    setShowPasswordDialog(true);
    setDeptPassword("");
  };

  const handlePasswordSubmit = () => {
    if (deptPassword === selectedDepartment.password) {
      localStorage.setItem("currentDepartment", JSON.stringify(selectedDepartment));
      navigate(`/admin/department/${selectedDepartment.id}`);
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect department password",
        variant: "destructive",
      });
    }
    setDeptPassword("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Department Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Department Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDepartments.map((dept) => (
            <Card
              key={dept.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
              onClick={() => handleDepartmentClick(dept)}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-primary-foreground">
                    {dept.abbreviation}
                  </span>
                </div>
                <CardTitle className="text-lg">{dept.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  Password Protected
                </CardDescription>
              </CardHeader>
            </Card>
          ))}

          {/* Add Department Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-dashed border-muted-foreground/30 hover:border-accent"
            onClick={() => setShowAddDialog(true)}
          >
            <CardHeader className="text-center pb-4 h-full flex flex-col items-center justify-center">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-lg text-accent">Add Department</CardTitle>
              <CardDescription>Create a new department</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Add Department Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Enter the details for the new department
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deptName">Department Name *</Label>
              <Input
                id="deptName"
                placeholder="e.g., Computer Science"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deptAbbr">Abbreviation (Optional)</Label>
              <Input
                id="deptAbbr"
                placeholder="e.g., CS"
                value={newDeptAbbr}
                onChange={(e) => setNewDeptAbbr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deptPassword">Department Password *</Label>
              <Input
                id="deptPassword"
                type="password"
                placeholder="Set a password for this department"
                value={newDeptPassword}
                onChange={(e) => setNewDeptPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDepartment} className="bg-gradient-primary hover:opacity-90">
              Add Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Department Password</DialogTitle>
            <DialogDescription>
              Enter the password to access {selectedDepartment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accessPassword">Password</Label>
              <Input
                id="accessPassword"
                type="password"
                placeholder="Enter department password"
                value={deptPassword}
                onChange={(e) => setDeptPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} className="bg-gradient-primary hover:opacity-90">
              Access Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
