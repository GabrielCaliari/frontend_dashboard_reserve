import { describe, expect, it } from "vitest";
import { applyLocalEntityQuery, LocalEntityLimitError } from "./local-query";

type Contact = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

const contacts: Contact[] = [
  { id: "1", name: "Ana", status: "active" },
  { id: "2", name: "Bruno", status: "inactive" },
  { id: "3", name: "Álvaro", status: "active" },
];

const options = {
  localItemLimit: 100,
  searchText: (contact: Contact) => contact.name,
  matchesFilters: (contact: Contact, filters: { status: string }) =>
    !filters.status || contact.status === filters.status,
  sortValue: (contact: Contact, field: string) =>
    field === "name" ? contact.name : null,
};

describe("applyLocalEntityQuery", () => {
  it("filters, folds accents, sorts, and paginates a local collection", () => {
    const result = applyLocalEntityQuery(
      contacts,
      {
        page: 1,
        pageSize: 1,
        search: "alvaro",
        sort: { field: "name", direction: "desc" },
        filters: { status: "active" },
      },
      options,
    );

    expect(result).toEqual({
      items: [{ id: "3", name: "Álvaro", status: "active" }],
      total: 1,
      page: 1,
      pageSize: 1,
    });
  });

  it("rejects collections above their declared local limit", () => {
    expect(() =>
      applyLocalEntityQuery(
        Array.from({ length: 101 }, (_, index) => contacts[index % 3]),
        { page: 1, pageSize: 30, search: "", filters: { status: "" } },
        options,
      ),
    ).toThrow(LocalEntityLimitError);
  });
});
