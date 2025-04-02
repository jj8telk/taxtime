"use client";

import { useEffect, useState } from "react";
import {
  DialogContentText,
  SelectChangeEvent,
  TablePagination,
} from "@mui/material";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Autocomplete,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function TransactionsTable() {
  const [filters, setFilters] = useState({
    year: "",
    month: "",
    vendor: "",
    source_bank: "",
    category: "",
    tax_category: "",
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [taxCategories, setTaxCategories] = useState<
    { id: number; name: string }[]
  >([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    vendor: string;
    category: string;
    tax_category: number | "";
  }>({
    vendor: "",
    category: "",
    tax_category: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      const vRes = await fetch("/api/vendors");
      const bRes = await fetch("/api/source-banks");
      const vendorsJson = await vRes.json();
      const banksJson = await bRes.json();
      setVendors(vendorsJson.vendors || []);
      setBanks(banksJson.source_banks || []);
      const tRes = await fetch("/api/tax-categories");
      const taxJson = await tRes.json();
      setTaxCategories(taxJson.tax_categories || []);
    };
    fetchOptions();
  }, []);

  // Fetch filtered transactions
  const fetchTransactions = async () => {
    const { vendor, category, tax_category, ...rest } = filters;

    const queryParams: Record<string, string> = Object.fromEntries(
      Object.entries(rest).filter(([_, v]) => v)
    );

    // Only include category if it's not the special __uncategorized__ tag
    if (category && category !== "__uncategorized__") {
      queryParams.category = category;
    }

    // Only include category if it's not the special __uncategorized__ tag
    if (tax_category && tax_category !== "Uncategorized") {
      queryParams.tax_category = tax_category;
    }

    const query = new URLSearchParams(queryParams).toString();
    const res = await fetch(`/api/transactions?${query}`);
    const json = await res.json();
    setTransactions(json.data || []);
    setPage(0);
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    filters.year,
    filters.month,
    filters.source_bank,
    filters.category,
    filters.tax_category,
  ]);

  const filteredTransactions = transactions.filter((t) => {
    const matchesVendor = filters.vendor
      ? t.vendor?.toLowerCase().includes(filters.vendor.toLowerCase())
      : true;

    const matchesCategory =
      filters.category === ""
        ? true
        : filters.category === "__uncategorized__"
        ? !t.category || t.category.trim() === ""
        : t.category === filters.category;

    const matchesTaxCategory =
      filters.tax_category === ""
        ? true
        : filters.tax_category === "Uncategorized"
        ? !t.tax_category_id
        : String(t.tax_category_id) === filters.tax_category;

    const matchesSourceBank = filters.source_bank
      ? t.source_bank === filters.source_bank
      : true;

    const matchesYear = filters.year ? t.date?.startsWith(filters.year) : true;

    const matchesMonth =
      filters.month && filters.year
        ? t.date?.startsWith(
            `${filters.year}-${filters.month.padStart(2, "0")}`
          )
        : true;

    return (
      matchesVendor &&
      matchesCategory &&
      matchesTaxCategory &&
      matchesSourceBank &&
      matchesYear &&
      matchesMonth
    );
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    const amt = typeof t.amount === "number" ? t.amount : parseFloat(t.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (valA == null) return 1;
    if (valB == null) return -1;

    if (sortBy === "amount") {
      return sortOrder === "asc"
        ? parseFloat(valA) - parseFloat(valB)
        : parseFloat(valB) - parseFloat(valA);
    }

    return sortOrder === "asc"
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const pagedTransactions = sortedTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // SELECT ALL
  const handleSelectAll = () => {
    if (selectedIds.length === pagedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedTransactions.map((t) => t.id));
    }
  };

  useEffect(() => {
    setSelectedIds([]);
  }, [filters, page, rowsPerPage]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async () => {
    const res = await fetch("/api/transactions/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selectedIds,
        updates: editForm,
      }),
    });

    const json = await res.json();
    if (json.updated) {
      setEditModalOpen(false);
      setEditForm({ vendor: "", category: "", tax_category: "" });
      setSelectedIds([]);
      fetchTransactions(); // Refresh data
    }
  };

  const closeModal = () => {
    setEditModalOpen(false);
    setEditForm({ vendor: "", category: "", tax_category: "" });
  };

  return (
    <Box mt={4}>
      <Typography variant='h6' gutterBottom>
        Transactions
      </Typography>

      <Box display='flex' gap={2} flexWrap='wrap' mb={2}>
        <TextField
          name='year'
          label='Year'
          value={filters.year}
          onChange={handleInputChange}
        />
        <TextField
          name='month'
          label='Month'
          value={filters.month}
          onChange={handleInputChange}
        />

        <Autocomplete
          freeSolo
          options={vendors}
          value={filters.vendor}
          onInputChange={(_, value) =>
            setFilters((prev) => ({ ...prev, vendor: value }))
          }
          renderInput={(params) => <TextField {...params} label='Vendor' />}
          fullWidth
        />

        <Autocomplete
          options={banks}
          value={filters.source_bank}
          onChange={(_, value) =>
            setFilters((prev) => ({ ...prev, source_bank: value || "" }))
          }
          renderInput={(params) => (
            <TextField {...params} label='Source Bank' />
          )}
          fullWidth
        />

        <FormControl style={{ minWidth: 120 }}>
          <InputLabel id='category-label'>Category</InputLabel>
          <Select
            labelId='category-label'
            name='category'
            value={filters.category}
            onChange={handleSelectChange}
            label='Category'
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='Personal'>Personal</MenuItem>
            <MenuItem value='Business'>Business</MenuItem>
            <MenuItem value='__uncategorized__'>Uncategorized</MenuItem>
          </Select>
        </FormControl>

        <Autocomplete
          options={[{ id: -1, name: "Uncategorized" }, ...taxCategories]}
          getOptionLabel={(option) => option.name}
          value={
            filters.tax_category
              ? taxCategories.find(
                  (cat) => String(cat.id) === filters.tax_category
                ) || null
              : null
          }
          onChange={(_, value) => {
            setFilters((prev) => ({
              ...prev,
              tax_category: value ? String(value.id) : "", // convert ID to string
            }));
          }}
          renderInput={(params) => (
            <TextField {...params} label='Tax Category' />
          )}
          fullWidth
        />
      </Box>

      {selectedIds.length > 0 && (
        <Box mb={2}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => setEditModalOpen(true)}
          >
            Edit {selectedIds.length} Selected
          </Button>
        </Box>
      )}
      <Box mb={2}>
        <Typography variant='subtitle1'>
          Total: <strong>${totalAmount.toFixed(2)}</strong>
        </Typography>
      </Box>

      <Paper sx={{ maxHeight: 600, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding='checkbox'>
                <Checkbox
                  checked={
                    pagedTransactions.length > 0 &&
                    selectedIds.length === pagedTransactions.length
                  }
                  indeterminate={
                    selectedIds.length > 0 &&
                    selectedIds.length < pagedTransactions.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              {[
                { label: "Date", key: "date" },
                { label: "Vendor", key: "vendor" },
                { label: "Description", key: "description" },
                { label: "Amount", key: "amount" },
                { label: "Category", key: "category" },
                { label: "Tax Category", key: "tax_category_name" },
                { label: "Source Bank", key: "source_bank" },
              ].map((col) => (
                <TableCell
                  key={col.key}
                  onClick={() => {
                    if (sortBy === col.key) {
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    } else {
                      setSortBy(col.key);
                      setSortOrder("asc");
                    }
                  }}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    backgroundColor: "secondary.light",
                    fontWeight: "bold",
                    color: "secondary.contrastText",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    "&:hover": {
                      backgroundColor: "secondary.main",
                    },
                  }}
                >
                  {col.label}
                  {sortBy === col.key
                    ? sortOrder === "asc"
                      ? " ↑"
                      : " ↓"
                    : ""}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTransactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((t) => (
                <TableRow key={t.id} selected={selectedIds.includes(t.id)}>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={selectedIds.includes(t.id)}
                      onChange={() => handleSelect(t.id)}
                    />
                  </TableCell>
                  <TableCell>{t.date?.slice(0, 10)}</TableCell>
                  <TableCell>{t.vendor}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>
                    $
                    {typeof t.amount === "number"
                      ? t.amount.toFixed(2)
                      : t.amount}
                  </TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{t.tax_category_name}</TableCell>
                  <TableCell>{t.source_bank}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <TablePagination
        component='div'
        count={sortedTransactions.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      <Dialog open={editModalOpen} onClose={closeModal}>
        <DialogTitle>Edit Selected Transactions</DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <DialogContentText>
            Changes will apply to {selectedIds.length} selected transaction
            {selectedIds.length > 1 ? "s" : ""}.
          </DialogContentText>
          <TextField
            label='Vendor'
            name='vendor'
            value={editForm.vendor}
            onChange={handleEditChange}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id='edit-category-label'>Category</InputLabel>
            <Select
              labelId='edit-category-label'
              name='category'
              value={editForm.category}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, category: e.target.value }))
              }
              label='Category'
            >
              <MenuItem value=''>None</MenuItem>
              <MenuItem value='Personal'>Personal</MenuItem>
              <MenuItem value='Business'>Business</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            options={taxCategories}
            getOptionLabel={(option) => option.name}
            value={
              editForm.tax_category
                ? taxCategories.find((c) => c.id === editForm.tax_category) ||
                  null
                : null
            }
            onChange={(_, value) =>
              setEditForm((prev) => ({
                ...prev,
                tax_category: value?.id || "",
              }))
            }
            renderInput={(params) => (
              <TextField {...params} label='Tax Category' fullWidth />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button
            onClick={handleSubmitEdit}
            variant='contained'
            color='primary'
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
