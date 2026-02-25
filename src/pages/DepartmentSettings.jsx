import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Settings, Users, BookOpen, GraduationCap, LogOut, Key, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DepartmentSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", abbreviation: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const storedDept = localStorage.getItem("currentDepartment");
    if (storedDept) {
      const dept = JSON.parse(storedDept);
      setDepartment(dept);
      setEditForm({ name: dept.name, abbreviation: dept.abbreviation || "" });
    } else {
      navigate("/admin");
    }
  }, [navigate]);

  const handleUpdateDepartment = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast({ title: "Error", description: "Department name is required", variant: "destructive" });
      return;
    }
    const updated = { ...department, name: editForm.name.trim(), abbreviation: editForm.abbreviation.trim() || department.abbreviation };
    setDepartment(updated);
    localStorage.setItem("currentDepartment", JSON.stringify(updated));
    setShowEditDetails(false);
    toast({ title: "Success", description: "Department details updated" });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.currentPassword !== department.password) {
      toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (!passwordForm.newPassword.trim()) {
      toast({ title: "Error", description: "New password cannot be empty", variant: "destructive" });
      return;
    }
    const updated = { ...department, password: passwordForm.newPassword.trim() };
    setDepartment(updated);
    localStorage.setItem("currentDepartment", JSON.stringify(updated));
    setShowChangePassword(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({ title: "Success", description: "Password changed successfully" });
  };

  const handleDeleteDepartment = () => {
    localStorage.removeItem("currentDepartment");
    toast({ title: "Deleted", description: `${department.name} has been deleted` });
    navigate("/admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentDepartment");
    navigate("/");
  };

  if (!department) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/department/${id}`)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Department Settings</h1>
                <p className="text-sm text-muted-foreground">{department.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`/admin/department/${id}`)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Department
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Department Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Department Details
              </CardTitle>
              <Dialog open={showEditDetails} onOpenChange={setShowEditDetails}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Department Details</DialogTitle>
                    <DialogDescription>Update the department name and abbreviation.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateDepartment} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editName">Department Name</Label>
                      <Input
                        id="editName"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editAbbr">Abbreviation</Label>
                      <Input
                        id="editAbbr"
                        value={editForm.abbreviation}
                        onChange={(e) => setEditForm({ ...editForm, abbreviation: e.target.value })}
                        placeholder="e.g., CSE"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowEditDetails(false)}>Cancel</Button>
                      <Button type="submit" className="bg-gradient-primary hover:opacity-90">Update Department</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Department Name</p>
              <p className="text-lg font-medium text-foreground">{department.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abbreviation</p>
              <p className="text-lg font-medium text-foreground">{department.abbreviation || "Not set"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your department's security</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Key className="w-4 h-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPwd">Current Password</Label>
                    <Input
                      id="currentPwd"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPwd">New Password</Label>
                    <Input
                      id="newPwd"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPwd">Confirm New Password</Label>
                    <Input
                      id="confirmPwd"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90">Change Password</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Quick actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/admin")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Once you delete this department, there is no going back. This will permanently delete the department
                and remove all associated data including faculty, students, and subjects.
              </p>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Department</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete "{department.name}" and all associated data.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteDepartment}>Delete Department</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DepartmentSettings;
