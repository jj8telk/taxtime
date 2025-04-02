"use client";

import { useState } from "react";
import { SelectChangeEvent } from "@mui/material";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
} from "@mui/material";

export default function ManualEntryForm() {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    vendor: "",
    description: "",
    transaction_type: "sale",
    source_bank: "",
  });

  const [open, setOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }
    >
  ) => {
    const name = e.target.name ?? "";
    setForm({ ...form, [name]: e.target.value as string });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
    };

    const res = await fetch("/api/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: [payload] }),
    });

    const json = await res.json();
    alert(`Transaction added. Rows inserted: ${json.inserted}`);
    setForm({
      date: "",
      amount: "",
      vendor: "",
      description: "",
      transaction_type: "sale",
      source_bank: "Sweetwater CC",
    });
    setOpen(false);
  };

  return (
    <Box mt={4}>
      <Button variant='outlined' onClick={() => setOpen((prev) => !prev)}>
        {open ? "Cancel" : "Add Manual Transaction"}
      </Button>

      <Collapse in={open}>
        <Box
          component='form'
          onSubmit={handleSubmit}
          mt={2}
          display='flex'
          flexDirection='column'
          gap={2}
        >
          <TextField
            name='date'
            label='Date'
            placeholder='YYYY-MM-DD'
            value={form.date}
            onChange={handleChange}
            required
          />

          <TextField
            name='amount'
            label='Amount'
            type='number'
            value={form.amount}
            onChange={handleChange}
            required
          />

          <TextField
            name='vendor'
            label='Vendor'
            value={form.vendor}
            onChange={handleChange}
            required
          />

          <TextField
            name='description'
            label='Description'
            value={form.description}
            onChange={handleChange}
            multiline
            minRows={2}
          />

          <FormControl fullWidth>
            <InputLabel id='transaction-type-label'>
              Transaction Type
            </InputLabel>
            <Select
              labelId='transaction-type-label'
              name='transaction_type'
              value={form.transaction_type}
              onChange={handleSelectChange}
              label='Transaction Type'
            >
              <MenuItem value='sale'>Sale</MenuItem>
              <MenuItem value='debit'>Debit</MenuItem>
              <MenuItem value='payment'>Payment</MenuItem>
              <MenuItem value='fee'>Fee</MenuItem>
            </Select>
          </FormControl>

          <TextField
            name='source_bank'
            label='Source Bank'
            value={form.source_bank}
            onChange={handleChange}
            required
          />

          <Button type='submit' variant='contained' color='primary'>
            Submit Transaction
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}
